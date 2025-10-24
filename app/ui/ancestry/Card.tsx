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
import { getAncestryUrl } from "@/lib/utils/url";

interface AncestryCardProps {
  hideDescription?: boolean;
  ancestry: Ancestry;
  creator?: User;
  link?: boolean;
}

export const Card = ({
  hideDescription = false,
  ancestry,
  creator,
  link = true,
}: AncestryCardProps) => {
  const { allConditions: conditions } = useConditions({
    creatorId: creator?.discordId,
  });

  const sizeOrder = ["tiny", "small", "medium", "large", "huge", "gargantuan"];
  const sizeLabels = ancestry.size
    .sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b))
    .map((s) => SIZES.find((size) => size.value === s)?.label || s)
    .join("/");

  return (
    <ShadcnCard className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-bold font-slab flex items-center gap-2">
          {link && ancestry.id ? (
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
      <CardContent className="flex-grow space-y-4">
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
};
