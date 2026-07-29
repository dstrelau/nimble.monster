import { ChevronRight, FlaskConical } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { RelationCounts } from "@/lib/db/custom-rule";
import { cn } from "@/lib/utils";

interface RuleIndexRowProps {
  href: string;
  title: string;
  /** Tailwind text color for the leading category bar. */
  colorClass?: string;
  /** Marks the row as homebrew: adds the flask and lets the toggle hide it. */
  homebrew?: boolean;
  counts?: RelationCounts;
}

export function RuleIndexRow({
  href,
  title,
  colorClass,
  homebrew,
  counts,
}: RuleIndexRowProps) {
  return (
    <li className="break-inside-avoid" data-homebrew={homebrew || undefined}>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-md py-2 pr-2 hover:bg-accent hover:text-accent-foreground"
      >
        <span
          className={cn(
            "w-0.5 self-stretch rounded-full bg-current",
            colorClass
          )}
        />
        {homebrew && (
          <FlaskConical className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {title}
        </span>
        {counts?.replaces ? <Badge variant="default">OVR</Badge> : null}
        {counts?.augments ? (
          <Badge variant="secondary">+{counts.augments}</Badge>
        ) : null}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground lg:hidden" />
      </Link>
    </li>
  );
}
