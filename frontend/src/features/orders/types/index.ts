export type OrderType = "VIP" | "NORMAL";

export interface Order {
  id: number;
  type: OrderType;
}

export interface Bot {
  id: number;
  status: "IDLE" | "PROCESSING";
  order: Order | null;
}

export interface State {
  pendingOrders: Order[];
  completeOrders: Order[];
  bots: Bot[];
  nextOrderId: number;
  nextBotId: number;
}

export type Action =
  | { type: "ADD_ORDER"; orderType: OrderType }
  | { type: "ADD_BOT" }
  | { type: "REMOVE_BOT" }
  | { type: "COMPLETE_ORDER"; botId: number };
