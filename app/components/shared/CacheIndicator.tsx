import { Badge } from "~/components/ui/badge";
import { CacheStatus } from "~/hooks/useCacheStatus";

export interface CacheIndicatorProps {
  status: CacheStatus;
}

export function CacheIndicator({ status }: CacheIndicatorProps) {
  if (import.meta.env.PROD) {
    return null;
  }

  const statusConfig: Record<
    CacheStatus,
    { variant: any; icon: string; label: string }
  > = {
    idle: {
      variant: "outline",
      icon: "⏳",
      label: "Idle",
    },
    "cache-hit": {
      variant: "default",
      icon: "✅",
      label: "Cache Hit",
    },
    fetching: {
      variant: "secondary",
      icon: "🔄",
      label: "Fetching...",
    },
    "cache-miss": {
      variant: "default",
      icon: "⬇️",
      label: "Cache Miss",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className="fixed bottom-4 left-4 gap-2 font-mono text-xs z-50"
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  );
}
