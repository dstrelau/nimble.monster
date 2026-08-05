import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DetailActionBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Right-aligned row of actions above an entity detail view.
 *
 * The buttons never shrink, so on narrow viewports the row is scrolled
 * horizontally instead of overflowing past the start edge (where `justify-end`
 * would put it out of reach). `w-max min-w-full` keeps the row right-aligned
 * while it fits and lets it grow past the scroll container once it doesn't.
 * The padding/negative-margin pair gives focus rings room without changing the
 * bar's effective spacing.
 */
export function DetailActionBar({ children, className }: DetailActionBarProps) {
  return (
    <div
      className={cn(
        "-mx-1 -mt-1 mb-5 overflow-x-auto px-1 pt-1 pb-1",
        className
      )}
    >
      <div className="flex w-max min-w-full items-start justify-end gap-2">
        {children}
      </div>
    </div>
  );
}
