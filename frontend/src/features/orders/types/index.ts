export type OrderType = "VIP" | "NORMAL";
export type BotStatus = "IDLE" | "PROCESSING";

export interface Order {
  id: number;
  type: OrderType;
}

export interface Bot {
  id: number;
  status: BotStatus;
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
  | { type: "BOT_PICK_ORDER"; botId: number }
  | { type: "COMPLETE_ORDER"; botId: number };
