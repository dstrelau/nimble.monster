import { AwardIcon, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Award } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AwardBadgeProps {
  award: Award;
}

const COLOR_CLASSES: Record<string, string> = {
  "rose": "text-rose-600 bg-rose-100 border-rose-200 dark:text-rose-500 dark:border-rose-500 dark:bg-rose-900",
  "red": "text-red-600 bg-red-100 border-red-200 dark:text-red-500 dark:border-red-500 dark:bg-red-900",
  "amber": "text-amber-600 bg-amber-100 border-amber-200 dark:text-amber-500 dark:border-amber-500 dark:bg-amber-900",
  "lime":"text-lime-600 bg-lime-100 border-lime-200 dark:text-lime-500 dark:border-lime-500 dark:bg-lime-900",
  "teal": "text-teal-600 bg-teal-100 border-teal-200 dark:text-teal-500 dark:border-teal-500 dark:bg-teal-900",
  "blue": "text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-500 dark:border-blue-500 dark:bg-blue-900",
  "purple": "text-purple-600 bg-purple-100 border-purple-200 dark:text-purple-500 dark:border-purple-500 dark:bg-purple-900",
  "slate": "text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-500 dark:border-slate-500 dark:bg-slate-900",
  "neutral": "text-neutral-600 bg-neutral-100 border-neutral-200 dark:text-neutral-500 dark:border-neutral-500 dark:bg-neutral-900",
};

export const AwardBadge = ({ award }: AwardBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("cursor-help px-1 py-0.5 flex items-center gap-0.5 text-sm small-caps font-semibold font-stretch-ultra-condensed border rounded-md", COLOR_CLASSES[award.color])}>
            <AwardIcon
              strokeWidth={3}
              className="size-4"
            />
            {award.abbreviation}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <Link
              href={award.url}
              className="flex items-baseline gap-1 font-semibold"
              target="_blank"
              rel="noopener noreferrer"
            >
              {award.name}
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
