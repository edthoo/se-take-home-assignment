import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Order } from "../types";

interface CompleteAreaProps {
  orders: Order[];
}

export function CompleteArea({ orders }: CompleteAreaProps) {
  return (
    <div className="flex-1">
      <h2 className="mb-3 text-lg font-semibold">
        COMPLETE{" "}
        <span className="text-muted-foreground font-normal">
          ({orders.length})
        </span>
      </h2>
      <div className="space-y-2" data-testid="complete-area">
        {orders.length === 0 && (
          <p className="text-sm text-muted-foreground">No completed orders</p>
        )}
        {orders.map((order) => (
          <Card key={order.id} size="sm" data-testid={`complete-order-${order.id}`}>
            <CardContent className="flex items-center justify-between py-0">
              <span className="font-medium">Order #{order.id}</span>
              <Badge
                variant={order.type === "VIP" ? "default" : "outline"}
                className={
                  order.type === "VIP"
                    ? "bg-amber-500 text-white"
                    : ""
                }
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
