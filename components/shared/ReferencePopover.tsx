"use client";

import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ReferencePopoverProps {
  trigger: ReactElement;
  children: ReactNode;
  label: string;
  className?: string;
}

// Reference information must be reachable by touch and keyboard, not just hover.
export function ReferencePopover({
  trigger,
  children,
  label,
  className,
}: ReferencePopoverProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const cancelClose = () => clearTimeout(closeTimer.current);
  const closeAfterHover = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 100);
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        cancelClose();
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger
        asChild
        onPointerEnter={(event) => {
          if (event.pointerType !== "mouse") return;
          cancelClose();
          setOpen(true);
        }}
        onPointerLeave={closeAfterHover}
      >
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        aria-label={label}
        side="top"
        collisionPadding={8}
        className={cn(
          "w-fit max-w-[min(20rem,calc(100vw-1rem))] max-h-(--radix-popover-content-available-height) overflow-y-auto px-3 py-1.5 text-xs text-wrap",
          className
        )}
        // Hover must not move focus away from what the reader is doing.
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onPointerEnter={cancelClose}
        onPointerLeave={closeAfterHover}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
