import { Badge } from "@/components/ui/badge";
import { Eye, Send, Star, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProposalStatusBadgeProps {
  status: string | null | undefined;
  size?: "sm" | "md";
}

const statusConfig = {
  sent: {
    label: "Sent",
    icon: Send,
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  viewed: {
    label: "Viewed",
    icon: Eye,
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  shortlisted: {
    label: "Shortlisted",
    icon: Star,
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  accepted: {
    label: "Accepted",
    icon: Check,
    className: "bg-green-100 text-green-700 border-green-200",
  },
  rejected: {
    label: "Rejected",
    icon: X,
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export function ProposalStatusBadge({ status, size = "md" }: ProposalStatusBadgeProps) {
  const normalizedStatus = (status || "pending") as keyof typeof statusConfig;
  const config = statusConfig[normalizedStatus] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        config.className,
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1"
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {config.label}
    </Badge>
  );
}
