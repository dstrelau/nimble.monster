"use client";

import { useState } from "react";
import { ModeToggle } from "@/components/layout/ModeToggle";
import { Card } from "@/components/monster/Card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { TROLL_HUNTER } from "./fixtures";

export function MonsterCardLab() {
  const [width, setWidth] = useState("standard");

  return (
    <div className="space-y-6">
      <h1 className="font-slab font-black text-4xl">Monster Card Viewer</h1>
      <div className="flex flex-wrap items-center gap-4">
        <ModeToggle />
        <Label id="card-width-label">Card width</Label>
        <ToggleGroup
          type="single"
          value={width}
          variant="outline"
          className="flex-wrap"
          aria-labelledby="card-width-label"
          onValueChange={(value) => {
            if (value) setWidth(value);
          }}
        >
          <ToggleGroupItem value="narrow">Narrow · 288px</ToggleGroupItem>
          <ToggleGroupItem value="standard">Standard · 384px</ToggleGroupItem>
          <ToggleGroupItem value="wide">Wide · 480px</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <article
        aria-label="Troll Hunter card"
        className={cn(
          "w-full",
          width === "narrow" && "max-w-72",
          width === "standard" && "max-w-96",
          width === "wide" && "max-w-120"
        )}
      >
        <Card monster={TROLL_HUNTER} link={false} hideActions />
      </article>
    </div>
  );
}
