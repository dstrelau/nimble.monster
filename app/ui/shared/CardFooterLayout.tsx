import type React from "react";
import { Attribution } from "@/app/ui/Attribution";
import { CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/lib/types";

interface CardFooterLayoutProps {
  creator?: User;
  hideCreator?: boolean;
  hideActions?: boolean;
  actionsSlot?: React.ReactNode;
}

export const CardFooterLayout: React.FC<CardFooterLayoutProps> = ({
  creator,
  hideCreator = false,
  hideActions = false,
  actionsSlot,
}) => {
  if (hideActions && hideCreator) return null;

  return (
    <>
      <Separator />
      <CardFooter className="flex-col items-stretch">
        <div className="flex items-center justify-between">
          {creator && !hideCreator ? <Attribution user={creator} /> : <div />}

          {!hideActions && actionsSlot}
        </div>
      </CardFooter>
    </>
  );
};
