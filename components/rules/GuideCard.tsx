import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Guide } from "@/lib/rules/guides";
import { cn } from "@/lib/utils";

export function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link href={guide.href} className="group">
      <Card className="h-full gap-3 bg-muted/40 transition-colors group-hover:border-primary/50">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span
              className={cn(
                "size-2 rounded-full bg-current",
                guide.category.color
              )}
            />
            {guide.category.label}
          </div>
          <CardTitle className="text-xl">{guide.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p className="line-clamp-2">{guide.summary}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
