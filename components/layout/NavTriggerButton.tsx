"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavTriggerButtonProps extends React.ComponentProps<typeof Button> {
  open?: boolean;
}

export const NavTriggerButton = ({
  open,
  className,
  ...props
}: NavTriggerButtonProps) => (
  <Button
    variant="ghost"
    className={cn(
      "flex items-center gap-2 rounded-none border-b-2 border-transparent text-header-foreground bg-transparent hover:text-header-foreground focus:text-header-foreground",
      !open && "hover:bg-muted focus:bg-muted",
      open && "bg-accent border-flame",
      className
    )}
    {...props}
  />
);
