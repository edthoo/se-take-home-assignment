import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Bot } from "../types";

interface BotControlsProps {
  bots: Bot[];
  onAddBot: () => void;
  onRemoveBot: () => void;
}

export function BotControls({ bots, onAddBot, onRemoveBot }: BotControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onAddBot} data-testid="add-bot">
          + Bot
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRemoveBot}
          disabled={bots.length === 0}
          data-testid="remove-bot"
        >
          - Bot
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {bots.length} bot{bots.length !== 1 && "s"}
        </span>
      </div>
      {bots.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid="bot-list">
          {bots.map((bot) => (
            <Badge
              key={bot.id}
              variant={bot.status === "PROCESSING" ? "default" : "secondary"}
              data-testid={`bot-${bot.id}`}
            >
              Bot #{bot.id}:{" "}
              {bot.order ? `Order #${bot.order.id}` : "Idle"}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
