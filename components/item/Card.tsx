"use client";
import { FileText } from "lucide-react";
import {
  resolveItemBackdrop,
  resolveItemColor,
} from "@/components/item/colors";
import { ItemImageStage } from "@/components/item/ItemImageStage";
import { Link } from "@/components/layout/Link";
import { CardFooterLayout } from "@/components/shared/CardFooterLayout";
import { FormattedText } from "@/components/shared/FormattedText";
import { MoreInfoSection } from "@/components/shared/MoreInfoSection";
import {
  ShareMenu,
  ShareMenuCopyURLItem,
  ShareMenuDownloadCardItem,
} from "@/components/shared/ShareMenu";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Card as ShadcnCard,
} from "@/components/ui/card";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Item, ItemRarity } from "@/lib/services/items";
import { RARITIES } from "@/lib/services/items";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  getItemImageUrl,
  getItemMarkdownUrl,
  getItemUrl,
} from "@/lib/utils/url";

const getRarityLabel = (rarity?: string): string | undefined =>
  rarity && rarity !== "unspecified"
    ? RARITIES.find((option) => option.value === rarity)?.label
    : undefined;

const RARITY_CARD_CLASSES: Partial<Record<ItemRarity, string>> = {
  common: "border-x-0 border-b-0 border-t-4 border-t-muted-foreground",
  uncommon: "border-x-0 border-b-0 border-t-4 border-t-green-700",
  rare: "border-x-0 border-b-0 border-t-4 border-t-indigo-800 dark:border-t-indigo-500",
  very_rare:
    "border-x-0 border-b-0 border-t-4 border-violet-400 rarity-gradient-top bg-slate-100/40 dark:bg-slate-800/40",
  legendary:
    "border-x-0 border-b-0 border-t-4 border-t-amber-700 bg-orange-100/40 dark:bg-orange-800/20",
};

// Rarity label text color, matching the design's pairing of a pale border
// with a bolder, more saturated label color for legibility. Uncommon/Rare
// reuse their border color directly since the design does too; Very
// Rare/Legendary go a shade or two more saturated than their (deliberately
// pale) border color.
const RARITY_TEXT_CLASSES: Partial<Record<ItemRarity, string>> = {
  uncommon: "text-green-700",
  rare: "text-indigo-800 dark:text-indigo-500",
  very_rare: "text-violet-700",
  legendary: "text-amber-700",
};

interface CardProps {
  item: Item;
  creator: User;
  link?: boolean;
  hideActions?: boolean;
  hideDescription?: boolean;
  className?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export const Card = ({
  item,
  creator,
  link = true,
  hideActions = false,
  hideDescription = false,
  className,
  selectable = false,
  selected = false,
  onSelect,
}: CardProps) => {
  const { allConditions } = useConditions({
    creatorId: creator.discordId,
    enabled: !hideDescription && !!item.description,
  });

  const imageColor = resolveItemColor(item.imageColor);
  const imageBgColor = resolveItemColor(item.imageBgColor);
  const backdrop = resolveItemBackdrop(item);
  const isLegendary = item.rarity === "legendary";

  const card = (
    <ShadcnCard
      className={cn(
        "relative py-0 h-fit",
        RARITY_CARD_CLASSES[item.rarity],
        className,
        selectable && selected && "ring-2 ring-amber-500"
      )}
      id={selectable ? undefined : `item-${item.id}`}
      {...(selectable && selected && { "data-selected": "" })}
    >
      {isLegendary && (
        <>
          <span className="pointer-events-none absolute top-2 left-2 size-4 rounded-tl-lg border-t-2 border-l-2 border-amber-700" />
          <span className="pointer-events-none absolute top-2 right-2 size-4 rounded-tr-lg border-t-2 border-r-2 border-amber-700" />
        </>
      )}
      {(item.imageIcon || item.imageBgIcon) && (
        <div className="relative flex flex-col items-center pt-2 -mb-5">
          <ItemImageStage
            backdrop={backdrop}
            imageIcon={item.imageIcon}
            imageBgIcon={item.imageBgIcon}
            imageColor={imageColor}
            imageBgColor={imageBgColor}
          />
        </div>
      )}
      <CardHeader
        className={cn(
          "relative z-10 text-center gap-0",
          !(item.imageIcon || item.imageBgIcon) && "pt-8 pb-4"
        )}
      >
        {getRarityLabel(item.rarity) && (
          <div
            className={cn(
              "font-slab text-sm font-extrabold tracking-widest text-muted-foreground uppercase",
              RARITY_TEXT_CLASSES[item.rarity]
            )}
          >
            {getRarityLabel(item.rarity)}
          </div>
        )}
        <CardTitle>
          <h2 className={cn("font-slab", "font-black text-2xl leading-tight")}>
            {!selectable && link && item.id ? (
              <Link href={getItemUrl(item)}>{item.name}</Link>
            ) : (
              item.name
            )}
          </h2>
        </CardTitle>
        {item.kind && (
          <CardDescription className="font-sans text-md italic">
            {item.kind}
          </CardDescription>
        )}
      </CardHeader>

      {hideDescription || (
        <CardContent
          className={cn(
            "flex flex-col gap-3 relative z-10",
            selectable && "pointer-events-none"
          )}
        >
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
      )}

      <CardFooterLayout
        creator={creator}
        source={item.source}
        awards={item.awards}
        hideActions={selectable || hideActions}
        className={cn("pb-4", selectable && "pointer-events-none")}
        actionsSlot={
          item.id && (
            <ShareMenu disabled={item.visibility !== "public"}>
              <DropdownMenuItem asChild>
                <a
                  className="flex gap-2 items-center"
                  href={getItemMarkdownUrl(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="w-4 h-4" />
                  Export to Markdown
                </a>
              </DropdownMenuItem>
              <ShareMenuDownloadCardItem
                name={`${item.name}.png`}
                path={getItemImageUrl(item)}
              />
              <ShareMenuCopyURLItem
                path={getItemUrl(item)}
                updatedAt={item.updatedAt}
              />
            </ShareMenu>
          )
        }
      />
    </ShadcnCard>
  );

  if (selectable) {
    return (
      <button
        type="button"
        className={cn(
          "cursor-pointer relative text-left transition-[filter] duration-150 hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]",
          selected && "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
        )}
        id={`item-${item.id}`}
        onClick={onSelect}
      >
        {card}
      </button>
    );
  }

  return card;
};
