"use client";

import { useState } from "react";
import { ModeToggle } from "@/components/layout/ModeToggle";
import { Card } from "@/components/monster/Card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeatureFlagsProvider } from "@/lib/contexts/FeatureFlagsContext";
import type { Monster } from "@/lib/services/monsters";
import { MONSTER_CARD_CASES } from "./fixtures";

export function MonsterCardLab() {
  const [width, setWidth] = useState("343");
  const [selectedCase, setSelectedCase] = useState("all");

  return (
    <FeatureFlagsProvider enabledFeatures={["monster-card-layout"]}>
      <div className="grid items-start gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
          <h1 className="font-slab font-black text-2xl">Monster cards</h1>
          <ModeToggle />
          <div className="space-y-2">
            <Label htmlFor="card-width">Card width</Label>
            <Select value={width} onValueChange={setWidth}>
              <SelectTrigger id="card-width" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="288">Narrow · 288px</SelectItem>
                <SelectItem value="343">Phone · 343px</SelectItem>
                <SelectItem value="384">Standard · 384px</SelectItem>
                <SelectItem value="480">Wide · 480px</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="card-case">Case</Label>
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger id="card-case" className="w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All eight cases</SelectItem>
                {MONSTER_CARD_CASES.map((sample) => (
                  <SelectItem key={sample.id} value={sample.id}>
                    {sample.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Solo conversions, classification assignments and damage interactions
            are illustrative, not published rules. Damage interactions are
            mockup-only, not new stored fields.
          </p>
        </aside>
        <div className="min-w-0 space-y-12">
          {MONSTER_CARD_CASES.filter(
            (sample) => selectedCase === "all" || sample.id === selectedCase
          ).map((sample) => (
            <section
              key={sample.id}
              id={`case-${sample.id}`}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold">{sample.label}</h2>
              <div className="overflow-x-auto pb-2">
                <div
                  className="grid w-max items-start gap-x-6 gap-y-4"
                  style={{ gridTemplateColumns: `repeat(2, ${width}px)` }}
                >
                  {[false, true].map((legendary) => {
                    const monster: Monster = {
                      ...sample.monster,
                      legendary,
                      hpPerHero: legendary
                        ? sample.soloHp
                        : sample.monster.hpPerHero,
                      saves: legendary ? sample.saves : undefined,
                      bloodied: legendary ? "Takes to the sky." : undefined,
                      lastStand: legendary ? "Dives one last time." : undefined,
                      abilities: sample.damageInteractions
                        ? sample.monster.abilities.filter(
                            (ability) => ability.name !== "Damage Interactions"
                          )
                        : sample.monster.abilities,
                    };
                    return (
                      <article
                        key={`${sample.id}-${legendary}`}
                        aria-label={`${sample.label}, ${legendary ? "Legendary" : "regular"}`}
                        data-variant={legendary ? "solo" : "regular"}
                        className="space-y-2"
                      >
                        <p className="text-xs text-muted-foreground">
                          {legendary ? "Legendary" : "Regular"}
                        </p>
                        <div className="pt-2">
                          <Card
                            monster={{
                              ...monster,
                              id: `${sample.id}-${legendary ? "solo" : "regular"}`,
                            }}
                            damageInteractions={sample.damageInteractions}
                            creator={monster.creator}
                            link={false}
                            noInteractive
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </FeatureFlagsProvider>
  );
}
