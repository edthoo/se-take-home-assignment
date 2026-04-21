import { useOrderController } from "../hooks/useOrderController";
import { OrderButtons } from "./OrderButtons";
import { BotControls } from "./BotControls";
import { OrderArea } from "./OrderArea";

export function OrderController() {
  const { state, addOrder, addBot, removeBot } = useOrderController();

  return (
    <div className="mx-auto w-full max-w-3xl p-6 space-y-4 h-screen overflow-hidden">
      <div className="rounded-xl bg-red-600 px-6 py-4 text-white">
        <h1 className="text-2xl font-bold tracking-tight">
          🍔 McDonald's Order Controller
        </h1>
        <p className="text-sm text-red-100">Automated cooking bot management</p>
      </div>

      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[calc(100vh-160px)]">
        <div className="rounded-lg border p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Orders
          </h2>
          <OrderButtons
            onNewNormalOrder={() => addOrder("NORMAL")}
            onNewVipOrder={() => addOrder("VIP")}
          />
        </div>
        <div className="rounded-lg border p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Bots
          </h2>
          <BotControls
            bots={state.bots}
            onAddBot={addBot}
            onRemoveBot={removeBot}
          />
        </div>
        <OrderArea
          title="PENDING"
          orders={state.pendingOrders}
          testId="pending-area"
          orderTestIdPrefix="pending-order"
          emptyMessage="No pending orders"
          accentClass="border-amber-200 bg-amber-50/50"
          headerClass="text-amber-700"
        />
        <OrderArea
          title="COMPLETE"
          orders={state.completeOrders}
          testId="complete-area"
          orderTestIdPrefix="complete-order"
          emptyMessage="No completed orders"
          accentClass="border-green-200 bg-green-50/50"
          headerClass="text-green-700"
        />
      </div>
    </div>
  );
}
