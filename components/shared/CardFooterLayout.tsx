import type React from "react";
import { AwardBadge } from "@/components/award/AwardBadge";
import { Attribution } from "@/components/shared/Attribution";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Award, Source, User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CardFooterLayoutProps {
  creator?: User;
  // Replaces the creator attribution, such as with several contributors.
  attributionSlot?: React.ReactNode;
  attributionSize?: React.ComponentProps<typeof Attribution>["size"];
  source?: Source;
  awards?: Award[];
  hideActions?: boolean;
  actionsSlot?: React.ReactNode;
  reactionsSlot?: React.ReactNode;
  paperforgeSlot?: React.ReactNode;
  className?: string;
  separatorClassName?: string;
  disableLink?: boolean;
}

export const CardFooterLayout: React.FC<CardFooterLayoutProps> = ({
  creator,
  attributionSlot,
  attributionSize = "default",
  source,
  awards = [],
  hideActions = false,
  actionsSlot,
  reactionsSlot,
  paperforgeSlot,
  className,
  separatorClassName,
  disableLink = false,
}) => {
  return (
    <>
      <Separator className={separatorClassName} />
      <CardFooter className={cn("flex-col items-stretch", className)}>
        <div className="flex items-center justify-between gap-2">
          {attributionSlot ??
            (creator ? (
              <Attribution
                user={creator}
                size={attributionSize}
                disableLink={disableLink}
              />
            ) : (
              <div />
            ))}

          <div className="flex items-center gap-2">
            {awards.map((award) => (
              <AwardBadge
                key={award.id}
                award={award}
                disableLink={disableLink}
              />
            ))}
            {!hideActions && reactionsSlot}
            {paperforgeSlot}
            {source && (
              <SourceBadge source={source} disableLink={disableLink} />
            )}
            {!hideActions && actionsSlot}
          </div>
        </div>
      </CardFooter>
    </>
  );
};
