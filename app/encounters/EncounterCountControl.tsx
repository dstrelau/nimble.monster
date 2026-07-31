"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface EncounterCountControlProps {
  quantity: number;
  isPerHero: boolean;
  heroesPerMonster: number;
  onQuantityChange: (quantity: number) => void;
  onIsPerHeroChange: (isPerHero: boolean) => void;
  onHeroesPerMonsterChange: (heroesPerMonster: number) => void;
  summary?: ReactNode;
  className?: string;
}

export function EncounterCountControl({
  quantity,
  isPerHero,
  heroesPerMonster,
  onQuantityChange,
  onIsPerHeroChange,
  onHeroesPerMonsterChange,
  summary,
  className,
}: EncounterCountControlProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-start gap-1.5",
        className
      )}
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <ToggleGroup
          type="single"
          value={isPerHero ? "per-hero" : "static"}
          onValueChange={(value) => {
            if (value) onIsPerHeroChange(value === "per-hero");
          }}
          variant="outline"
          size="sm"
          aria-label="Monster count mode"
          className="gap-0.5 rounded-md bg-background p-0.5 font-sans"
        >
          <ToggleGroupItem
            value="static"
            className="h-7 px-2 text-xs leading-none"
          >
            Static
          </ToggleGroupItem>
          <ToggleGroupItem
            value="per-hero"
            className="h-7 px-2 text-xs leading-none"
          >
            Per hero
          </ToggleGroupItem>
        </ToggleGroup>
        {summary && (
          <div className="whitespace-nowrap font-slab text-xs tabular-nums">
            {summary}
          </div>
        )}
      </div>

      <div className="flex max-w-full flex-wrap items-center gap-1.5 font-sans text-sm not-italic">
        <Input
          type="number"
          min={1}
          aria-label="Monster count"
          className="h-8 w-14 bg-background text-center tabular-nums"
          value={quantity}
          onChange={(event) =>
            onQuantityChange(Math.max(1, Number(event.target.value)))
          }
        />
        <span className="leading-8">
          {quantity === 1 ? "monster" : "monsters"}
        </span>
        {isPerHero && (
          <>
            <span className="leading-8">per</span>
            <Input
              type="number"
              min={1}
              aria-label="Heroes per monster"
              className="h-8 w-14 bg-background text-center tabular-nums"
              value={heroesPerMonster}
              onChange={(event) =>
                onHeroesPerMonsterChange(
                  Math.max(1, Number(event.target.value))
                )
              }
            />
            <span className="leading-8">
              {heroesPerMonster === 1 ? "hero" : "heroes"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
