import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Source } from "@/lib/types";

interface SourceBadgeProps {
  source: Source;
}

export const SourceBadge = ({ source }: SourceBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="cursor-help">
            <span className="flex items-center gap-1">
              {source.abbreviation}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            {source.link ? (
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
