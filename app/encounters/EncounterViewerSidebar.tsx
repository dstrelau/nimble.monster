"use client";

import { useState } from "react";
import type { Encounter } from "@/lib/types";
import { EncounterCombatTracker } from "./EncounterCombatTracker";
import { EncounterStatsPanel } from "./EncounterStatsPanel";

interface EncounterViewerSidebarProps {
  encounter: Encounter;
}

export function EncounterViewerSidebar({
  encounter,
}: EncounterViewerSidebarProps) {
  const [heroCount, setHeroCount] = useState(encounter.heroCount);
  const [heroLevel, setHeroLevel] = useState(encounter.heroLevel);
  const localEncounter = { ...encounter, heroCount, heroLevel };
  const heroesChanged =
    heroCount !== encounter.heroCount || heroLevel !== encounter.heroLevel;

  return (
    <div className="lg:col-span-1 print:col-span-1 lg:sticky lg:top-4 print:static flex flex-col gap-6">
      <EncounterStatsPanel
        encounter={localEncounter}
        onHeroCountChange={setHeroCount}
        onHeroLevelChange={setHeroLevel}
        onResetHeroes={
          heroesChanged
            ? () => {
                setHeroCount(encounter.heroCount);
                setHeroLevel(encounter.heroLevel);
              }
            : undefined
        }
      />
      <EncounterCombatTracker encounter={localEncounter} />
    </div>
  );
}
