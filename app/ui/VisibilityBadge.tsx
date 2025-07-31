import { Badge } from "@/components/ui/badge";

interface VisibilityBadgeProps {
  visibility: "public" | "private" | "secret";
  className?: string;
}

export function VisibilityBadge({
  visibility,
  className,
}: VisibilityBadgeProps) {
  if (visibility === "private") {
    return null;
  }

  const badgeText = visibility === "public" ? "Public" : "Secret";
  const variant = visibility === "public" ? "default" : "secondary";

  return (
    <Badge variant={variant} className={className}>
      {badgeText}
    </Badge>
  );
}
