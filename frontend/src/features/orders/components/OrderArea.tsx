import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Order } from "../types";

const VIP_BADGE_CLASS = "bg-amber-500 text-white";

function useRelativeTime(date: Date): string {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const seconds = Math.floor((now - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s ago`;
}

function formatAbsolute(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function PendingTimestamp({ createdAt }: { createdAt: Date }) {
  const relative = useRelativeTime(createdAt);
  return (
    <span className="text-xs text-muted-foreground" title={formatAbsolute(createdAt)}>
      {relative}
    </span>
  );
}

function CompleteTimestamp({ createdAt, completedAt }: { createdAt: Date; completedAt: Date }) {
  const duration = Math.round((completedAt.getTime() - createdAt.getTime()) / 1000);
  return (
    <span
      className="text-xs text-muted-foreground"
      title={`${formatAbsolute(createdAt)} → ${formatAbsolute(completedAt)}`}
    >
      Completed in {duration}s
    </span>
  );
}

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
            className={`bg-white border-l-3 ${
              order.type === "VIP" ? "border-l-amber-500" : "border-l-gray-300"
            }`}
            data-testid={`${orderTestIdPrefix}-${order.id}`}
          >
            <CardContent className="flex items-center justify-between py-0">
              <div className="flex flex-col">
                <span className="font-medium">Order #{order.id}</span>
                {order.completedAt ? (
                  <CompleteTimestamp createdAt={order.createdAt} completedAt={order.completedAt} />
                ) : (
                  <PendingTimestamp createdAt={order.createdAt} />
                )}
              </div>
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
