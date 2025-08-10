import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VisibilityBadgeProps {
  visibility: "public" | "private" | "secret";
  className?: string;
}

export function VisibilityBadge({
  visibility,
  className,
}: VisibilityBadgeProps) {
  const badgeText = visibility === "public" ? "Public" : "Private";
  const variant = visibility === "public" ? "secondary" : "default";

  return (
    <Badge variant={variant} className={cn("h-6", className)}>
      {badgeText}
    </Badge>
  );
}
