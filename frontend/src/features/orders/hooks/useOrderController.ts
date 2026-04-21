import { useReducer, useRef, useEffect, useCallback } from "react";
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
      const order: Order = { id: state.nextOrderId, type: action.orderType };
      return {
        ...state,
        pendingOrders: insertByPriority(state.pendingOrders, order),
        nextOrderId: state.nextOrderId + 1,
      };
    }
    case "ADD_BOT": {
      const bot = { id: state.nextBotId, status: "IDLE" as const, order: null };
      return {
        ...state,
        bots: [...state.bots, bot],
        nextBotId: state.nextBotId + 1,
      };
    }
    case "REMOVE_BOT": {
      if (state.bots.length === 0) return state;
      const newest = state.bots[state.bots.length - 1];
      let pendingOrders = state.pendingOrders;
      if (newest.order) {
        pendingOrders = insertByPriority(pendingOrders, newest.order);
      }
      return {
        ...state,
        bots: state.bots.slice(0, -1),
        pendingOrders,
      };
    }
    case "BOT_PICK_ORDER": {
      if (state.pendingOrders.length === 0) return state;
      const [first, ...rest] = state.pendingOrders;
      return {
        ...state,
        pendingOrders: rest,
        bots: state.bots.map((b) =>
          b.id === action.botId
            ? { ...b, status: "PROCESSING" as const, order: first }
            : b
        ),
      };
    }
    case "COMPLETE_ORDER": {
      const bot = state.bots.find((b) => b.id === action.botId);
      if (!bot?.order) return state;
      return {
        ...state,
        completeOrders: [...state.completeOrders, bot.order],
        bots: state.bots.map((b) =>
          b.id === action.botId
            ? { ...b, status: "IDLE" as const, order: null }
            : b
        ),
      };
    }
    default:
      return state;
  }
}

export function useOrderController() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Orchestration: assign idle bots to pending orders & start timers
  useEffect(() => {
    // Start timers for PROCESSING bots that don't have one yet
    for (const bot of state.bots) {
      if (bot.status === "PROCESSING" && !timers.current.has(bot.id)) {
        const id = setTimeout(() => {
          timers.current.delete(bot.id);
          dispatch({ type: "COMPLETE_ORDER", botId: bot.id });
        }, PROCESS_TIME);
        timers.current.set(bot.id, id);
      }
    }

    // Assign idle bots to pending orders
    if (state.pendingOrders.length > 0) {
      const idleBot = state.bots.find(
        (b) => b.status === "IDLE" && !timers.current.has(b.id)
      );
      if (idleBot) {
        dispatch({ type: "BOT_PICK_ORDER", botId: idleBot.id });
      }
    }
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const addOrder = useCallback((orderType: OrderType) => {
    dispatch({ type: "ADD_ORDER", orderType });
  }, []);

  const addBot = useCallback(() => {
    dispatch({ type: "ADD_BOT" });
  }, []);

  const removeBot = useCallback(() => {
    // Clear timer for newest bot before dispatching
    const newest = state.bots[state.bots.length - 1];
    if (newest && timers.current.has(newest.id)) {
      clearTimeout(timers.current.get(newest.id));
      timers.current.delete(newest.id);
    }
    dispatch({ type: "REMOVE_BOT" });
  }, [state.bots]);

  return { state, addOrder, addBot, removeBot };
}
