"use client";

import { useState } from "react";
import { Card } from "@/components/companion/Card";
import { ModeToggle } from "@/components/layout/ModeToggle";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMPANION_CARD_CASES } from "./fixtures";

export function CompanionLab() {
  const [width, setWidth] = useState("343");

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 md:px-8">
      <header className="space-y-2">
        <p className="font-semibold text-muted-foreground text-sm uppercase tracking-widest">
          Entity Lab
        </p>
        <h1 className="font-slab font-black text-4xl">Companions</h1>
        <p className="max-w-3xl text-muted-foreground">
          Development-only fixtures for reviewing companion cards without
          creating database records.
        </p>
      </header>
      <section
        aria-label="Companion lab controls"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border bg-card p-3"
      >
        <div className="flex items-center gap-2">
          <Label>Theme</Label>
          <ModeToggle />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="companion-card-width">Card width</Label>
          <Select value={width} onValueChange={setWidth}>
            <SelectTrigger id="companion-card-width">
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
        {COMPANION_CARD_CASES.map((sample) => (
          <article
            key={sample.id}
            aria-label={sample.label}
            className="space-y-2"
            style={{ width: `${width}px` }}
          >
            <h2 className="font-semibold text-sm">{sample.label}</h2>
            <div className="pt-2">
              <Card
                companion={sample.companion}
                creator={sample.companion.creator}
                link={false}
                hideActions
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
