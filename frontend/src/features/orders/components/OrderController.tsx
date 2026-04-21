import { useOrderController } from "../hooks/useOrderController";
import { OrderButtons } from "./OrderButtons";
import { BotControls } from "./BotControls";
import { OrderArea } from "./OrderArea";

export function OrderController() {
  const { state, addOrder, addBot, removeBot } = useOrderController();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">McDonald's Order Controller</h1>

      <div className="space-y-4">
        <OrderButtons
          onNewNormalOrder={() => addOrder("NORMAL")}
          onNewVipOrder={() => addOrder("VIP")}
        />
        <BotControls
          bots={state.bots}
          onAddBot={addBot}
          onRemoveBot={removeBot}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <OrderArea
          title="PENDING"
          orders={state.pendingOrders}
          testId="pending-area"
          orderTestIdPrefix="pending-order"
        />
        <OrderArea
          title="COMPLETE"
          orders={state.completeOrders}
          testId="complete-area"
          orderTestIdPrefix="complete-order"
        />
      </div>
    </div>
  );
}
