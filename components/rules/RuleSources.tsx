import type { RuleSource } from "@/lib/rules/filesystem";
import { cn } from "@/lib/utils";

function formatSource({ book, pages }: RuleSource): string {
  if (!pages) return `${book} (page unknown)`;
  return `${book} ${pages.length === 1 ? "p." : "pp."} ${pages.join(", ")}`;
}

export function RuleSources({
  sources,
  className,
}: {
  sources?: RuleSource[];
  className?: string;
}) {
  if (!sources) return null;
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {sources.map(formatSource).join("; ")}
    </p>
  );
}
