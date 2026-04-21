import { useReducer, useRef, useEffect } from "react";
import type { State, Action, Order, OrderType } from "../types";

const DEFAULT_PROCESS_TIME = 10_000;

function getProcessTime(): number {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("processTime");
    if (t) return Number(t);
  }
  return DEFAULT_PROCESS_TIME;
}

function insertByPriority(queue: Order[], order: Order): Order[] {
  if (order.type === "VIP") {
    // Insert among VIPs, sorted by ID to maintain original order
    const lastVipIdx = queue.findLastIndex((o) => o.type === "VIP");
    const vipSection = queue.slice(0, lastVipIdx + 1);
    const rest = queue.slice(lastVipIdx + 1);

    // Find correct position within VIP section by ID
    const insertIdx = vipSection.findIndex((o) => o.id > order.id);
    if (insertIdx === -1) {
      return [...vipSection, order, ...rest];
    }
    return [
      ...vipSection.slice(0, insertIdx),
      order,
      ...vipSection.slice(insertIdx),
      ...rest,
    ];
  }

  // NORMAL: insert among normals, sorted by ID to maintain original order
  const firstNormalIdx = queue.findIndex((o) => o.type === "NORMAL");
  if (firstNormalIdx === -1) {
    // No normals yet, append
    return [...queue, order];
  }

  const vipSection = queue.slice(0, firstNormalIdx);
  const normalSection = queue.slice(firstNormalIdx);

  const insertIdx = normalSection.findIndex((o) => o.id > order.id);
  if (insertIdx === -1) {
    return [...vipSection, ...normalSection, order];
  }
  return [
    ...vipSection,
    ...normalSection.slice(0, insertIdx),
    order,
    ...normalSection.slice(insertIdx),
  ];
}

function assignIdleBots(state: State): State {
  let { pendingOrders, bots } = state;
  let changed = false;

  bots = bots.map((bot) => {
    if (bot.status === "IDLE" && pendingOrders.length > 0) {
      const [first, ...rest] = pendingOrders;
      pendingOrders = rest;
      changed = true;
      return { ...bot, status: "PROCESSING" as const, order: first };
    }
    return bot;
  });

  return changed ? { ...state, pendingOrders, bots } : state;
}

export const initialState: State = {
  pendingOrders: [],
  completeOrders: [],
  bots: [],
  nextOrderId: 1,
  nextBotId: 1,
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_ORDER": {
      const order: Order = {
        id: state.nextOrderId,
        type: action.orderType,
        createdAt: new Date(),
        completedAt: null,
      };
      return assignIdleBots({
        ...state,
        pendingOrders: insertByPriority(state.pendingOrders, order),
        nextOrderId: state.nextOrderId + 1,
      });
    }
    case "ADD_BOT": {
      const bot = { id: state.nextBotId, status: "IDLE" as const, order: null };
      return assignIdleBots({
        ...state,
        bots: [...state.bots, bot],
        nextBotId: state.nextBotId + 1,
      });
    }
    case "REMOVE_BOT": {
      if (state.bots.length === 0) return state;
      const newest = state.bots[state.bots.length - 1];
      let pendingOrders = state.pendingOrders;
      if (newest.order) {
        pendingOrders = insertByPriority(pendingOrders, newest.order);
      }
      return assignIdleBots({ ...state, bots: state.bots.slice(0, -1), pendingOrders });
    }
    case "COMPLETE_ORDER": {
      const bot = state.bots.find((b) => b.id === action.botId);
      if (!bot?.order) return state;
      return assignIdleBots({
        ...state,
        completeOrders: [
          ...state.completeOrders,
          { ...bot.order, completedAt: new Date() },
        ],
        bots: state.bots.map((b) =>
          b.id === action.botId
            ? { ...b, status: "IDLE" as const, order: null }
            : b
        ),
      });
    }
    default:
      return state;
  }
}

export function useOrderController() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const stateRef = useRef(state);
  stateRef.current = state;

  // Effect ONLY manages timers — no orchestration dispatches
  useEffect(() => {
    const processTime = getProcessTime();
    for (const bot of state.bots) {
      if (bot.status === "PROCESSING" && !timers.current.has(bot.id)) {
        const id = setTimeout(() => {
          timers.current.delete(bot.id);
          dispatch({ type: "COMPLETE_ORDER", botId: bot.id });
        }, processTime);
        timers.current.set(bot.id, id);
      }
    }
  }, [state.bots]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const removeBot = () => {
    const bots = stateRef.current.bots;
    const newest = bots[bots.length - 1];
    if (newest && timers.current.has(newest.id)) {
      clearTimeout(timers.current.get(newest.id));
      timers.current.delete(newest.id);
    }
    dispatch({ type: "REMOVE_BOT" });
  };

  return {
    state,
    addOrder: (orderType: OrderType) =>
      dispatch({ type: "ADD_ORDER", orderType }),
    addBot: () => dispatch({ type: "ADD_BOT" }),
    removeBot,
  };
}
