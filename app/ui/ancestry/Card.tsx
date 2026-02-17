"use client";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { Link } from "@/components/app/Link";
import { FormattedText } from "@/components/FormattedText";
import { Badge } from "@/components/ui/badge";
import {
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Card as ShadcnCard,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Ancestry } from "@/lib/services/ancestries";
import { SIZES } from "@/lib/services/ancestries";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getAncestryUrl } from "@/lib/utils/url";

interface AncestryCardProps {
  hideDescription?: boolean;
  ancestry: Ancestry;
  creator?: User;
  link?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export const Card = ({
  hideDescription = false,
  ancestry,
  creator,
  link = true,
  selectable = false,
  selected = false,
  onSelect,
}: AncestryCardProps) => {
  const { allConditions: conditions } = useConditions({
    creatorId: creator?.discordId,
  });
  const effectiveLink = selectable ? false : link;

  const sizeOrder = ["tiny", "small", "medium", "large", "huge", "gargantuan"];
  const sizeLabels = ancestry.size
    .sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b))
    .map((s) => SIZES.find((size) => size.value === s)?.label || s)
    .join("/");

  const card = (
    <ShadcnCard
      className={cn(
        "h-full flex flex-col",
        selectable && selected && "ring-2 ring-amber-500"
      )}
      {...(selectable && selected && { "data-selected": "" })}
    >
      <CardHeader>
        <CardTitle className="text-xl font-bold font-slab flex items-center gap-2">
          {effectiveLink && ancestry.id ? (
            <Link href={getAncestryUrl(ancestry)}>{ancestry.name}</Link>
          ) : (
            ancestry.name
          )}
          {sizeLabels && (
            <span className="text-sm font-light font-sans">{sizeLabels}</span>
          )}
        </CardTitle>
        <CardAction>
          {ancestry.rarity === "exotic" && (
            <Badge variant="secondary">Exotic</Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent
        className={cn(
          "flex-grow space-y-4",
          selectable && "pointer-events-none"
        )}
      >
        {!hideDescription && (
          <FormattedText
            className="text-muted-foreground italic"
            content={ancestry.description}
            conditions={conditions}
          />
        )}
        {ancestry.abilities.map((ability) => (
          <div key={ability.name}>
            <h4 className="font-bold font-stretch-ultra-condensed">
              {ability.name}
            </h4>
            <FormattedText
              content={ability.description}
              conditions={conditions}
            />
          </div>
        ))}
      </CardContent>
      <CardFooterLayout
        creator={creator || ancestry.creator}
        source={ancestry.source}
        awards={ancestry.awards}
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
