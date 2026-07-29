import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function RuleSectionHeading({
  title,
  count,
  icon,
}: {
  title: string;
  count: number;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {icon}
        {title}
      </h2>
      <Badge variant="secondary">{count}</Badge>
      <Separator className="min-w-8 flex-1" />
    </div>
  );
}
