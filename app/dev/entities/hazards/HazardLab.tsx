"use client";

import { useState } from "react";
import { HAZARD_CARD_CASES } from "@/app/dev/monster-card/fixtures";
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
import { toHazardMonsterView } from "@/lib/services/hazards";

export function HazardLab() {
  const [width, setWidth] = useState("343");

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 md:px-8">
      <header className="space-y-2">
        <p className="font-semibold text-muted-foreground text-sm uppercase tracking-widest">
          Entity Lab
        </p>
        <h1 className="font-slab font-black text-4xl">Hazards</h1>
        <p className="max-w-3xl text-muted-foreground">
          Development-only fixtures for reviewing hazard cards. Hazards render
          through the shared monster card.
        </p>
      </header>
      <section
        aria-label="Hazard lab controls"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border bg-card p-3"
      >
        <div className="flex items-center gap-2">
          <Label>Theme</Label>
          <ModeToggle />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="hazard-card-width">Card width</Label>
          <Select value={width} onValueChange={setWidth}>
            <SelectTrigger id="hazard-card-width">
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
      </section>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-10">
        {HAZARD_CARD_CASES.map((sample) => (
          <article
            key={sample.id}
            aria-label={sample.label}
            className="space-y-2"
            style={{ width: `${width}px` }}
          >
            <h2 className="font-semibold text-sm">{sample.label}</h2>
            <div className="pt-2">
              <Card
                monster={toHazardMonsterView(sample.hazard)}
                creator={sample.hazard.creator}
                link={false}
                hideActions
                noInteractive
                showEncounterGuidelines={sample.showEncounterGuidelines}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
