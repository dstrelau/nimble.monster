import type React from "react";
import { Attribution } from "@/app/ui/Attribution";
import { AwardBadge } from "@/components/AwardBadge";
import { SourceBadge } from "@/components/SourceBadge";
import { CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Award, Source, User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CardFooterLayoutProps {
  creator?: User;
  source?: Source;
  awards?: Award[];
  hideActions?: boolean;
  actionsSlot?: React.ReactNode;
  paperforgeSlot?: React.ReactNode;
  className?: string;
  disableLink?: boolean;
}

export const CardFooterLayout: React.FC<CardFooterLayoutProps> = ({
  creator,
  source,
  awards = [],
  hideActions = false,
  actionsSlot,
  paperforgeSlot,
  className,
  disableLink = false,
}) => {
  return (
    <>
      <Separator />
      <CardFooter className={cn("flex-col items-stretch", className)}>
        <div className="flex items-center justify-between gap-2">
          {creator ? (
            <Attribution user={creator} disableLink={disableLink} />
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {awards.map((award) => (
              <AwardBadge key={award.id} award={award} />
            ))}
            {paperforgeSlot}
            {source && <SourceBadge source={source} />}
            {!hideActions && actionsSlot}
          </div>
        </div>
      </CardFooter>
    </>
  );
};
