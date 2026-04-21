import { useReducer, useRef, useEffect } from "react";
import type { State, Action, Order, OrderType } from "../types";

const PROCESS_TIME = 10_000;

function insertByPriority(queue: Order[], order: Order): Order[] {
  if (order.type === "VIP") {
    const lastVipIdx = queue.findLastIndex((o) => o.type === "VIP");
    const insertAt = lastVipIdx + 1;
    return [...queue.slice(0, insertAt), order, ...queue.slice(insertAt)];
  }
  return [...queue, order];
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
    for (const bot of state.bots) {
      if (bot.status === "PROCESSING" && !timers.current.has(bot.id)) {
        const id = setTimeout(() => {
          timers.current.delete(bot.id);
          dispatch({ type: "COMPLETE_ORDER", botId: bot.id });
        }, PROCESS_TIME);
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
