import { AwardIcon } from "lucide-react";
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

export const AWARD_COLOR_CLASSES: Record<string, string> = {
  rose: "text-rose-700 bg-rose-100 border-rose-300 dark:text-rose-300 dark:border-rose-400 dark:bg-rose-900",
  red: "text-red-700 bg-red-100 border-red-300 dark:text-red-300 dark:border-red-400 dark:bg-red-900",
  amber:
    "text-amber-700 bg-amber-100 border-amber-300 dark:text-amber-300 dark:border-amber-400 dark:bg-amber-900",
  lime: "text-lime-700 bg-lime-100 border-lime-300 dark:text-lime-300 dark:border-lime-400 dark:bg-lime-900",
  teal: "text-teal-700 bg-teal-100 border-teal-300 dark:text-teal-300 dark:border-teal-400 dark:bg-teal-900",
  blue: "text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-300 dark:border-blue-400 dark:bg-blue-900",
  purple:
    "text-purple-700 bg-purple-100 border-purple-300 dark:text-purple-300 dark:border-purple-400 dark:bg-purple-900",
  slate:
    "text-slate-700 bg-slate-100 border-slate-300 dark:text-slate-300 dark:border-slate-400 dark:bg-slate-900",
  neutral:
    "text-neutral-700 bg-neutral-100 border-neutral-300 dark:text-neutral-300 dark:border-neutral-400 dark:bg-neutral-900",
};

export const AWARD_COLORS = Object.keys(AWARD_COLOR_CLASSES);

export const AwardBadge = ({ award }: AwardBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={award.url}
            className={cn(
              "px-1 py-0.5 flex items-center gap-0.5 text-sm small-caps font-stretch-ultra-condensed border rounded-md",
              AWARD_COLOR_CLASSES[award.color]
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <AwardIcon className="size-3.5" />
            {award.abbreviation}
          </Link>
        </TooltipTrigger>
        <TooltipContent className="text-sm">{award.name}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
