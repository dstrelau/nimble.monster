"use client";
import { Crown, EyeOff, Minus, PersonStanding, Plus, X } from "lucide-react";
import { Link } from "@/components/layout/Link";
import { PaperforgeImage } from "@/components/paperforge/PaperforgeImage";
import { Level } from "@/components/shared/Level";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import type { EncounterMonsterEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getMonsterUrl } from "@/lib/utils/url";

interface EncounterMonsterRowProps {
  entry: EncounterMonsterEntry;
  onRemove?: (id: string) => void;
  onQuantityChange?: (id: string, quantity: number) => void;
  onIsPerHeroToggle?: (id: string, isPerHero: boolean) => void;
}

export const EncounterMonsterRow = ({
  entry,
  onRemove,
  onQuantityChange,
  onIsPerHeroToggle,
}: EncounterMonsterRowProps) => {
  const { monster, quantity, isPerHero } = entry;
  const editable = Boolean(onQuantityChange);

  return (
    <div className="flex gap-1 items-center">
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(monster.id)}
          className="rounded p-0.5 hover:bg-muted"
        >
          <X className="size-4 stroke-muted-foreground" />
        </button>
      )}
      <div className="font-slab flex-1 flex gap-1 items-center font-medium small-caps italic">
        <div className="w-7 shrink-0 flex items-center justify-center">
          {monster.legendary && monster.paperforgeId ? (
            <div className="flex flex-col items-center">
              <Crown className="size-5 stroke-flame -mb-2.5" />
              <PaperforgeImage
                id={monster.paperforgeId}
                size={28}
                className="rounded-sm"
              />
            </div>
          ) : monster.paperforgeId ? (
            <PaperforgeImage
              id={monster.paperforgeId}
              size={28}
              className="rounded-sm"
            />
          ) : monster.legendary ? (
            <Crown className="size-5 stroke-flame" />
          ) : monster.minion ? (
            <PersonStanding className="size-5 stroke-flame" />
          ) : null}
        </div>
        {monster.visibility === "private" && (
          <EyeOff className="size-5 inline self-center stroke-flame" />
        )}
        <span>
          <Link
            href={getMonsterUrl(monster)}
            className={cn(
              "text-lg mr-2",
              monster.visibility === "private" && "text-muted-foreground"
            )}
          >
            {monster.name}
          </Link>
          <span className="font-sans font-medium text-muted-foreground text-sm small-caps not-italic text-nowrap">
            {monster.levelInt !== 0 && (
              <>
                Lvl <Level level={monster.level} />
              </>
            )}
          </span>
        </span>
      </div>
      {editable ? (
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => onQuantityChange?.(monster.id, quantity - 1)}
            disabled={quantity <= 1}
          >
            <Minus />
          </Button>
          <span className="w-5 text-center font-slab font-black">
            {quantity}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => onQuantityChange?.(monster.id, quantity + 1)}
          >
            <Plus />
          </Button>
          <Toggle
            size="sm"
            pressed={isPerHero}
            onPressedChange={(pressed) =>
              onIsPerHeroToggle?.(monster.id, pressed)
            }
            className="font-sans text-xs not-italic"
          >
            /hero
          </Toggle>
        </div>
      ) : (
        <div className="font-slab font-black italic text-sm shrink-0">
          &times;{quantity}
          {isPerHero && <span className="font-sans text-xs">/hero</span>}
        </div>
      )}
    </div>
  );
};
