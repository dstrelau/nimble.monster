"use client";
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
import { cn } from "@/lib/utils";

const formatRarityDisplay = (rarity?: string): string => {
  if (!rarity || rarity === "unspecified") return "";

  const rarityOption = RARITIES.find((option) => option.value === rarity);
  return rarityOption ? `${rarityOption.label} ` : "";
};

export const FG_COLOR_CLASSES: Record<string, string> = {
  "red-200":
    "fill-red-200 stroke-red-400 dark:fill-red-400 dark:stroke-red-200",
  "red-400":
    "fill-red-400 stroke-red-600 dark:fill-red-600 dark:stroke-red-400",
  "red-600":
    "fill-red-600 stroke-red-800 dark:fill-red-800 dark:stroke-red-600",
  "orange-200":
    "fill-orange-200 stroke-orange-400 dark:fill-orange-400 dark:stroke-orange-200",
  "orange-400":
    "fill-orange-400 stroke-orange-600 dark:fill-orange-600 dark:stroke-orange-400",
  "orange-600":
    "fill-orange-600 stroke-orange-800 dark:fill-orange-800 dark:stroke-orange-600",
  "amber-200":
    "fill-amber-200 stroke-amber-400 dark:fill-amber-400 dark:stroke-amber-200",
  "amber-400":
    "fill-amber-400 stroke-amber-600 dark:fill-amber-600 dark:stroke-amber-400",
  "amber-600":
    "fill-amber-600 stroke-amber-800 dark:fill-amber-800 dark:stroke-amber-600",
  "yellow-200":
    "fill-yellow-200 stroke-yellow-400 dark:fill-yellow-400 dark:stroke-yellow-200",
  "yellow-400":
    "fill-yellow-400 stroke-yellow-600 dark:fill-yellow-600 dark:stroke-yellow-400",
  "yellow-600":
    "fill-yellow-600 stroke-yellow-800 dark:fill-yellow-800 dark:stroke-yellow-600",
  "lime-200":
    "fill-lime-200 stroke-lime-400 dark:fill-lime-400 dark:stroke-lime-200",
  "lime-400":
    "fill-lime-400 stroke-lime-600 dark:fill-lime-600 dark:stroke-lime-400",
  "lime-600":
    "fill-lime-600 stroke-lime-800 dark:fill-lime-800 dark:stroke-lime-600",
  "green-200":
    "fill-green-200 stroke-green-400 dark:fill-green-400 dark:stroke-green-200",
  "green-400":
    "fill-green-400 stroke-green-600 dark:fill-green-600 dark:stroke-green-400",
  "green-600":
    "fill-green-600 stroke-green-800 dark:fill-green-800 dark:stroke-green-600",
  "emerald-200":
    "fill-emerald-200 stroke-emerald-400 dark:fill-emerald-400 dark:stroke-emerald-200",
  "emerald-400":
    "fill-emerald-400 stroke-emerald-600 dark:fill-emerald-600 dark:stroke-emerald-400",
  "emerald-600":
    "fill-emerald-600 stroke-emerald-800 dark:fill-emerald-800 dark:stroke-emerald-600",
  "teal-200":
    "fill-teal-200 stroke-teal-400 dark:fill-teal-400 dark:stroke-teal-200",
  "teal-400":
    "fill-teal-400 stroke-teal-600 dark:fill-teal-600 dark:stroke-teal-400",
  "teal-600":
    "fill-teal-600 stroke-teal-800 dark:fill-teal-800 dark:stroke-teal-600",
  "cyan-200":
    "fill-cyan-200 stroke-cyan-400 dark:fill-cyan-400 dark:stroke-cyan-200",
  "cyan-400":
    "fill-cyan-400 stroke-cyan-600 dark:fill-cyan-600 dark:stroke-cyan-400",
  "cyan-600":
    "fill-cyan-600 stroke-cyan-800 dark:fill-cyan-800 dark:stroke-cyan-600",
  "sky-200":
    "fill-sky-200 stroke-sky-400 dark:fill-sky-400 dark:stroke-sky-200",
  "sky-400":
    "fill-sky-400 stroke-sky-600 dark:fill-sky-600 dark:stroke-sky-400",
  "sky-600":
    "fill-sky-600 stroke-sky-800 dark:fill-sky-800 dark:stroke-sky-600",
  "blue-200":
    "fill-blue-200 stroke-blue-400 dark:fill-blue-400 dark:stroke-blue-200",
  "blue-400":
    "fill-blue-400 stroke-blue-600 dark:fill-blue-600 dark:stroke-blue-400",
  "blue-600":
    "fill-blue-600 stroke-blue-800 dark:fill-blue-800 dark:stroke-blue-600",
  "indigo-200":
    "fill-indigo-200 stroke-indigo-400 dark:fill-indigo-400 dark:stroke-indigo-200",
  "indigo-400":
    "fill-indigo-400 stroke-indigo-600 dark:fill-indigo-600 dark:stroke-indigo-400",
  "indigo-600":
    "fill-indigo-600 stroke-indigo-800 dark:fill-indigo-800 dark:stroke-indigo-600",
  "violet-200":
    "fill-violet-200 stroke-violet-400 dark:fill-violet-400 dark:stroke-violet-200",
  "violet-400":
    "fill-violet-400 stroke-violet-600 dark:fill-violet-600 dark:stroke-violet-400",
  "violet-600":
    "fill-violet-600 stroke-violet-800 dark:fill-violet-800 dark:stroke-violet-600",
  "purple-200":
    "fill-purple-200 stroke-purple-400 dark:fill-purple-400 dark:stroke-purple-200",
  "purple-400":
    "fill-purple-400 stroke-purple-600 dark:fill-purple-600 dark:stroke-purple-400",
  "purple-600":
    "fill-purple-600 stroke-purple-800 dark:fill-purple-800 dark:stroke-purple-600",
  "fuchsia-200":
    "fill-fuchsia-200 stroke-fuchsia-400 dark:fill-fuchsia-400 dark:stroke-fuchsia-200",
  "fuchsia-400":
    "fill-fuchsia-400 stroke-fuchsia-600 dark:fill-fuchsia-600 dark:stroke-fuchsia-400",
  "fuchsia-600":
    "fill-fuchsia-600 stroke-fuchsia-800 dark:fill-fuchsia-800 dark:stroke-fuchsia-600",
  "pink-200":
    "fill-pink-200 stroke-pink-400 dark:fill-pink-400 dark:stroke-pink-200",
  "pink-400":
    "fill-pink-400 stroke-pink-600 dark:fill-pink-600 dark:stroke-pink-400",
  "pink-600":
    "fill-pink-600 stroke-pink-800 dark:fill-pink-800 dark:stroke-pink-600",
  "rose-200":
    "fill-rose-200 stroke-rose-400 dark:fill-rose-400 dark:stroke-rose-200",
  "rose-400":
    "fill-rose-400 stroke-rose-600 dark:fill-rose-600 dark:stroke-rose-400",
  "rose-600":
    "fill-rose-600 stroke-rose-800 dark:fill-rose-800 dark:stroke-rose-600",
  "slate-200":
    "fill-slate-200 stroke-slate-400 dark:fill-slate-400 dark:stroke-slate-200",
  "slate-400":
    "fill-slate-400 stroke-slate-600 dark:fill-slate-600 dark:stroke-slate-400",
  "slate-600":
    "fill-slate-600 stroke-slate-800 dark:fill-slate-800 dark:stroke-slate-600",
  "gray-200":
    "fill-gray-200 stroke-gray-400 dark:fill-gray-400 dark:stroke-gray-200",
  "gray-400":
    "fill-gray-400 stroke-gray-600 dark:fill-gray-600 dark:stroke-gray-400",
  "gray-600":
    "fill-gray-600 stroke-gray-800 dark:fill-gray-800 dark:stroke-gray-600",
  "zinc-200":
    "fill-zinc-200 stroke-zinc-400 dark:fill-zinc-400 dark:stroke-zinc-200",
  "zinc-400":
    "fill-zinc-400 stroke-zinc-600 dark:fill-zinc-600 dark:stroke-zinc-400",
  "zinc-600":
    "fill-zinc-600 stroke-zinc-800 dark:fill-zinc-800 dark:stroke-zinc-600",
  "neutral-200":
    "fill-neutral-200 stroke-neutral-400 dark:fill-neutral-400 dark:stroke-neutral-200",
  "neutral-400":
    "fill-neutral-400 stroke-neutral-600 dark:fill-neutral-600 dark:stroke-neutral-400",
  "neutral-600":
    "fill-neutral-600 stroke-neutral-800 dark:fill-neutral-800 dark:stroke-neutral-600",
  "stone-200":
    "fill-stone-200 stroke-stone-400 dark:fill-stone-400 dark:stroke-stone-200",
  "stone-400":
    "fill-stone-400 stroke-stone-600 dark:fill-stone-600 dark:stroke-stone-400",
  "stone-600":
    "fill-stone-600 stroke-stone-800 dark:fill-stone-800 dark:stroke-stone-600",
};

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
      <CardContainer className={`relative py-0 ${className}`}>
        <div
          className={cn(
            "flex flex-col items-center py-4",
            item.imageBgIcon ? "min-h-56" : item.imageIcon ? "min-h-48" : "py-0"
          )}
        >
          {item.imageBgIcon && (
            <GameIcon
              iconId={item.imageBgIcon}
              className={cn(
                "size-56 fill-foreground",
                item.imageBgColor && FG_COLOR_CLASSES[item.imageBgColor]
              )}
            />
          )}
          {item.imageIcon && (
            <GameIcon
              iconId={item.imageIcon}
              className={cn(
                "absolute size-42 stroke-6 z-10 left-1/2 transform -translate-x-1/2 drop-shadow-lg",
                "fill-foreground",
                item.imageBgIcon && "mt-7",
                item.imageColor && FG_COLOR_CLASSES[item.imageColor]
              )}
            />
          )}
        </div>
        <CardHeader className="text-center gap-0">
          <CardTitle>
            <h2
              className={cn("font-slab", "font-black text-2xl leading-tight")}
            >
              {link && item.id ? (
                <Link href={`/items/${item.id}`}>{item.name}</Link>
              ) : (
                item.name
              )}
            </h2>
          </CardTitle>
          {(item.rarity || item.kind) && (
            <CardDescription className={cn("font-sans text-md")}>
              {formatRarityDisplay(item.rarity)}
              {item.kind || ""}
            </CardDescription>
          )}
        </CardHeader>

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
          className="pb-4"
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
