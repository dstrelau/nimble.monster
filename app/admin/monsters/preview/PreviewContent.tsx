"use client";

import { useId, useState } from "react";
import {
  cancelOfficialMonstersUploadAction,
  commitOfficialMonstersAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DiffCounts, MonsterWithDiff } from "@/lib/services/monsters/diff";
import { FamilySection } from "./FamilySection";

interface Family {
  id: string;
  name: string;
  description?: string;
  abilities: Array<{ name: string; description: string }>;
}

interface PreviewContentProps {
  sessionKey: string;
  sourceName?: string;
  totalMonsters: number;
  totalFamilies: number;
  sortedFamilyIds: (string | null)[];
  monstersByFamily: Map<string | null, MonsterWithDiff[]>;
  familyInfoMap: Map<string, Family>;
  diffCounts: DiffCounts;
}

export function PreviewContent({
  sessionKey,
  sourceName,
  totalMonsters,
  totalFamilies,
  sortedFamilyIds,
  monstersByFamily,
  familyInfoMap,
  diffCounts,
}: PreviewContentProps) {
  const [hideUnchanged, setHideUnchanged] = useState(false);
  const switchId = useId();

  return (
    <div className="py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Preview Official Monsters</h1>
          <p className="text-muted-foreground">
            {totalMonsters} monster{totalMonsters !== 1 ? "s" : ""} and{" "}
            {totalFamilies} famil{totalFamilies !== 1 ? "ies" : "y"} ready to
            import
            {sourceName && (
              <>
                {" "}
                from <span className="font-medium">{sourceName}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-4">
          <form
            action={cancelOfficialMonstersUploadAction.bind(null, sessionKey)}
          >
            <Button type="submit" variant="destructive">
              Cancel
            </Button>
          </form>
          <form action={commitOfficialMonstersAction.bind(null, sessionKey)}>
            <Button type="submit">Approve All</Button>
          </form>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id={switchId}
            checked={hideUnchanged}
            onCheckedChange={setHideUnchanged}
          />
          <Label htmlFor={switchId}>Hide unchanged</Label>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="text-green-600 font-medium">{diffCounts.new}</span>{" "}
          new ·{" "}
          <span className="text-amber-600 font-medium">
            {diffCounts.updated}
          </span>{" "}
          updated ·{" "}
          <span className="text-gray-500 font-medium">
            {diffCounts.unchanged}
          </span>{" "}
          unchanged
        </div>
      </div>

      <div className="space-y-6">
        {sortedFamilyIds.map((familyId) => {
          const monsters = monstersByFamily.get(familyId) || [];
          const family = familyId ? familyInfoMap.get(familyId) : null;

          return (
            <FamilySection
              key={familyId || "no-family"}
              family={family || null}
              monsters={monsters}
              hideUnchanged={hideUnchanged}
            />
          );
        })}
      </div>
    </div>
  );
}
