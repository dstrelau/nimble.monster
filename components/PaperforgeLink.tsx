import { Anvil, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PaperForgeEntry } from "@/lib/paperforge-catalog";

export const PaperforgeLink: React.FC<{ entry: PaperForgeEntry }> = ({
  entry,
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={entry.postUrl || "https://www.patreon.com/c/paperforge"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Anvil className="size-4" />
        </a>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm flex items-baseline gap-1">
          Paper Forge: #{entry.id} {entry.name}
          <ExternalLink className="size-3" />
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
