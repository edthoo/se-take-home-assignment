import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Order } from "../types";

const VIP_BADGE_CLASS = "bg-amber-500 text-white";

interface OrderAreaProps {
  title: string;
  orders: Order[];
  testId: string;
  orderTestIdPrefix: string;
  emptyMessage: string;
  accentClass: string;
  headerClass: string;
}

export function OrderArea({
  title,
  orders,
  testId,
  orderTestIdPrefix,
  emptyMessage,
  accentClass,
  headerClass,
}: OrderAreaProps) {
  return (
    <div className={`rounded-lg border p-4 min-h-[200px] ${accentClass}`}>
      <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${headerClass}`}>
        {title}{" "}
        <span className="inline-flex items-center justify-center rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium tabular-nums">
          {orders.length}
        </span>
      </h2>
      <div className="space-y-2" data-testid={testId}>
        {orders.length === 0 && (
          <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
        )}
        {orders.map((order) => (
          <Card
            key={order.id}
            size="sm"
            className="bg-white"
            data-testid={`${orderTestIdPrefix}-${order.id}`}
          >
            <CardContent className="flex items-center justify-between py-0">
              <span className="font-medium">Order #{order.id}</span>
              <Badge
                variant={order.type === "VIP" ? "default" : "outline"}
                className={order.type === "VIP" ? VIP_BADGE_CLASS : ""}
              >
                {order.type}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
