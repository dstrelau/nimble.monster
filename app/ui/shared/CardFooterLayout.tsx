import type React from "react";
import { Attribution } from "@/app/ui/Attribution";
import { CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CardFooterLayoutProps {
  creator?: User;
  hideActions?: boolean;
  actionsSlot?: React.ReactNode;
  className?: string;
}

export const CardFooterLayout: React.FC<CardFooterLayoutProps> = ({
  creator,
  hideActions = false,
  actionsSlot,
  className,
}) => {
  return (
    <>
      <Separator />
      <CardFooter className={cn("flex-col items-stretch", className)}>
        <div className="flex items-center justify-between">
          {creator ? <Attribution user={creator} /> : <div />}

          {!hideActions && actionsSlot}
        </div>
      </CardFooter>
    </>
  );
};
