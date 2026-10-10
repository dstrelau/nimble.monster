import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { ReferencePopover } from "@/components/shared/ReferencePopover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Source } from "@/lib/types";

interface SourceBadgeProps {
  source: Source;
  disableLink?: boolean;
}

export const SourceBadge = ({
  source,
  disableLink = false,
}: SourceBadgeProps) => {
  return (
    <ReferencePopover
      label={source.name}
      trigger={
        <Badge variant="outline" asChild>
          <Button
            type="button"
            variant="link"
            className="h-auto px-2 py-0.5 text-xs"
          >
            {source.abbreviation}
          </Button>
        </Badge>
      }
    >
      <div className="text-sm">
        {source.link && !disableLink ? (
          <Link
            href={source.link}
            className="flex items-baseline gap-1 font-semibold"
          >
            {source.name}
            <ExternalLink className="size-3" />
          </Link>
        ) : (
          <span className="font-semibold">{source.name}</span>
        )}
        <div className="text-muted-foreground">{source.license}</div>
      </div>
    </ReferencePopover>
  );
};
