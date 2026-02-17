"use client";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { Link } from "@/components/app/Link";
import { FormattedText } from "@/components/FormattedText";
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
        className={cn(selectable && "pointer-events-none")}
      />
    </ShadcnCard>
  );

  if (selectable) {
    return (
      <button
        type="button"
        className={cn(
          "w-full cursor-pointer relative text-left transition-[filter] duration-150 hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]",
          selected && "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
        )}
        onClick={onSelect}
      >
        {card}
      </button>
    );
  }

  return card;
};
