"use client";

import { useId, useState } from "react";
import {
  cancelOfficialSubclassesUploadAction,
  commitOfficialSubclassesAction,
} from "@/app/admin/actions";
import { Card as SubclassCard } from "@/app/ui/subclass/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  DiffCounts,
  DiffStatus,
  SubclassWithDiff,
} from "@/lib/services/subclasses/diff";
import { cn } from "@/lib/utils";

interface PreviewContentProps {
  sessionKey: string;
  sourceName?: string;
  items: SubclassWithDiff[];
  diffCounts: DiffCounts;
}

const statusBadgeStyles: Record<DiffStatus, string> = {
  new: "bg-green-100 text-green-800 hover:bg-green-100",
  updated: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  unchanged: "bg-gray-100 text-gray-600 hover:bg-gray-100",
};

export function PreviewContent({
  sessionKey,
  sourceName,
  items,
  diffCounts,
}: PreviewContentProps) {
  const [hideUnchanged, setHideUnchanged] = useState(false);
  const switchId = useId();

  const filtered = hideUnchanged
    ? items.filter((i) => i.status !== "unchanged")
    : items;

  const grouped = filtered.reduce(
    (acc, item) => {
      if (!acc[item.subclass.className]) {
        acc[item.subclass.className] = [];
      }
      acc[item.subclass.className].push(item);
      return acc;
    },
    {} as Record<string, SubclassWithDiff[]>
  );

  const sortedClassNames = Object.keys(grouped).sort();

  return (
    <div className="py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Preview Official Subclasses
          </h1>
          <p className="text-muted-foreground">
            {items.length} subclass{items.length !== 1 ? "es" : ""} ready to
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
            action={cancelOfficialSubclassesUploadAction.bind(null, sessionKey)}
          >
            <Button type="submit" variant="destructive">
              Cancel
            </Button>
          </form>
          <form action={commitOfficialSubclassesAction.bind(null, sessionKey)}>
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

      <div className="space-y-8">
        {sortedClassNames.map((className) => (
          <div key={className} className="space-y-4">
            <h2 className="text-2xl font-semibold">{className}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {grouped[className].map(({ subclass, status }) => (
                <div
                  key={`${subclass.className}:${subclass.name}`}
                  className="relative"
                >
                  <Badge
                    variant="secondary"
                    className={cn(
                      "absolute -top-2 -right-2 z-10 uppercase text-xs",
                      statusBadgeStyles[status]
                    )}
                  >
                    {status}
                  </Badge>
                  <SubclassCard subclass={subclass} link={false} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
