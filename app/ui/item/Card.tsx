"use client";
import type React from "react";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { MoreInfoSection } from "@/app/ui/shared/MoreInfoSection";
import { CardContainer } from "@/app/ui/shared/StyledComponents";
import { Link } from "@/components/app/Link";
import { FormattedText } from "@/components/FormattedText";
import { GameIcon } from "@/components/GameIcon";
import {
  ShareMenu,
  ShareMenuCopyURLItem,
  ShareMenuDownloadCardItem,
} from "@/components/ShareMenu";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import { type Item, RARITIES, type User } from "@/lib/types";

const formatRarityDisplay = (rarity?: string): string => {
  if (!rarity || rarity === "unspecified") return "";

  const rarityOption = RARITIES.find((option) => option.value === rarity);
  return rarityOption ? `${rarityOption.label} ` : "";
};

const HeaderItem: React.FC<{
  item: Item;
  link?: boolean;
}> = ({ item, link = true }) => (
  <CardHeader>
    <CardTitle className="font-slab font-black text-2xl leading-tight flex items-center gap-3">
      {link && item.id ? (
        <Link href={`/items/${item.id}`}>{item.name}</Link>
      ) : (
        item.name
      )}
    </CardTitle>
    {(item.rarity || item.kind) && (
      <CardDescription className="font-condensed text-md">
        {formatRarityDisplay(item.rarity)}
        {item.kind || ""}
      </CardDescription>
    )}
  </CardHeader>
);

interface CardProps {
  item: Item;
  creator: User;
  link?: boolean;
  hideActions?: boolean;
  hideCreator?: boolean;
  className?: string;
}

export const Card = ({
  item,
  creator,
  link = true,
  hideActions = false,
  hideCreator = false,
  className,
}: CardProps) => {
  const { allConditions } = useConditions({
    creatorId: creator.discordId,
  });
  return (
    <div className="max-w-sm mx-auto" id={`item-${item.id}`}>
      <CardContainer className={`relative ${className}`}>
        {item.imageIcon && (
          <GameIcon
            iconId={item.imageIcon}
            className="absolute top-4 right-4 w-24 h-24 fill-icon/50 z-0"
          />
        )}
        <div className="relative z-10">
          <HeaderItem item={item} link={link} />
        </div>

        <CardContent className="flex flex-col gap-3 relative z-10">
          {item.description && (
            <FormattedText
              content={item.description}
              conditions={allConditions}
            />
          )}

          <MoreInfoSection
            moreInfo={item.moreInfo}
            conditions={allConditions}
          />
        </CardContent>

        <CardFooterLayout
          creator={creator}
          hideCreator={hideCreator}
          hideActions={hideActions}
          className="z-10"
          actionsSlot={
            <ShareMenu disabled={item.visibility !== "public"}>
              <ShareMenuDownloadCardItem
                name={`${item.name}.png`}
                path={`/items/${item.id}/image`}
              />
              <ShareMenuCopyURLItem path={`/items/${item.id}`} />
            </ShareMenu>
          }
        />
      </CardContainer>
    </div>
  );
};
