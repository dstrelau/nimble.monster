"use client";
import { EntityReactions } from "@/components/EntityReactions";
import { Link } from "@/components/layout/Link";
import { CardFooterLayout } from "@/components/shared/CardFooterLayout";
import { FormattedText } from "@/components/shared/FormattedText";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Card as ShadcnCard,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Background } from "@/lib/services/backgrounds";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getBackgroundUrl } from "@/lib/utils/url";

interface BackgroundCardProps {
  background: Background;
  creator?: User;
  link?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export const Card = ({
  background,
  creator,
  link = true,
  selectable = false,
  selected = false,
  onSelect,
}: BackgroundCardProps) => {
  const { allConditions: conditions } = useConditions({
    creatorId: creator?.discordId,
  });

  const effectiveLink = selectable ? false : link;

  const card = (
    <ShadcnCard
      className={cn(
        "flex flex-col",
        selectable && selected && "ring-2 ring-amber-500"
      )}
      {...(selectable && selected && { "data-selected": "" })}
    >
      <CardHeader>
        <CardTitle className="text-xl font-bold font-slab">
          {effectiveLink && background.id ? (
            <Link href={getBackgroundUrl(background)}>{background.name}</Link>
          ) : (
            background.name
          )}
        </CardTitle>
        {background.requirement && (
          <CardDescription className="italic">
            Requirement: {background.requirement}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent
        className={cn("flex-grow", selectable && "pointer-events-none")}
      >
        <FormattedText
          content={background.description}
          conditions={conditions}
        />
      </CardContent>
      <CardFooterLayout
        creator={creator || background.creator}
        source={background.source}
        awards={background.awards}
        className={cn(selectable && "relative z-40")}
        reactionsSlot={
          !selectable &&
          background.id && (
            <EntityReactions entityType="background" entityId={background.id} />
          )
        }
      />
    </ShadcnCard>
  );

  if (selectable) {
    return (
      <div
        className={cn(
          "w-full cursor-pointer relative text-left transition-[filter] duration-150 hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]",
          selected && "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
        )}
      >
        <button
          type="button"
          aria-label={`Select ${background.name}`}
          aria-pressed={selected}
          className="absolute inset-0 z-30 rounded-xl focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          onClick={onSelect}
        />
        {card}
      </div>
    );
  }

  return card;
};
