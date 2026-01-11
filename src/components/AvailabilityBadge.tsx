import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AvailabilityBadgeProps {
  status: "available" | "busy" | "offline" | string | null | undefined;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusConfig = {
  available: {
    label: "Available",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
  },
  busy: {
    label: "Busy",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-200",
  },
  offline: {
    label: "Offline",
    color: "bg-gray-400",
    textColor: "text-gray-600",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
  },
};

export function AvailabilityBadge({ 
  status, 
  showLabel = true, 
  size = "md" 
}: AvailabilityBadgeProps) {
  const normalizedStatus = (status || "offline") as keyof typeof statusConfig;
  const config = statusConfig[normalizedStatus] || statusConfig.offline;

  const dotSizes = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (!showLabel) {
    return (
      <span 
        className={cn(
          "inline-block rounded-full animate-pulse",
          dotSizes[size],
          config.color
        )}
        title={config.label}
      />
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5",
        textSizes[size],
        config.bgColor,
        config.textColor,
        config.borderColor
      )}
    >
      <span className={cn("rounded-full", dotSizes[size], config.color)} />
      {config.label}
    </Badge>
  );
}
