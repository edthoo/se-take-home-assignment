import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Order } from "../types";

const VIP_BADGE_CLASS = "bg-amber-500 text-white";

interface OrderAreaProps {
  title: string;
  orders: Order[];
  testId: string;
  orderTestIdPrefix: string;
}

export function OrderArea({
  title,
  orders,
  testId,
  orderTestIdPrefix,
}: OrderAreaProps) {
  return (
    <div className="flex-1">
      <h2 className="mb-3 text-lg font-semibold">
        {title}{" "}
        <span className="text-muted-foreground font-normal">
          ({orders.length})
        </span>
      </h2>
      <div className="space-y-2" data-testid={testId}>
        {orders.length === 0 && (
          <p className="text-sm text-muted-foreground">No {title.toLowerCase()} orders</p>
        )}
        {orders.map((order) => (
          <Card key={order.id} size="sm" data-testid={`${orderTestIdPrefix}-${order.id}`}>
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
