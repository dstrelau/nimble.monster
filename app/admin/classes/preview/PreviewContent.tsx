"use client";

import { useId, useState } from "react";
import {
  cancelOfficialClassesUploadAction,
  commitOfficialClassesAction,
} from "@/app/admin/actions";
import { ClassDetailView } from "@/app/ui/class/ClassDetailView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  ClassWithDiff,
  DiffCounts,
  DiffStatus,
} from "@/lib/services/classes/diff";
import { cn } from "@/lib/utils";

interface PreviewContentProps {
  sessionKey: string;
  sourceName?: string;
  items: ClassWithDiff[];
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

  return (
    <div className="py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Preview Official Classes</h1>
          <p className="text-muted-foreground">
            {items.length} class{items.length !== 1 ? "es" : ""} ready to import
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
            action={cancelOfficialClassesUploadAction.bind(null, sessionKey)}
          >
            <Button type="submit" variant="destructive">
              Cancel
            </Button>
          </form>
          <form action={commitOfficialClassesAction.bind(null, sessionKey)}>
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

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map(({ classEntity, status }) => (
          <div key={classEntity.name} className="relative">
            <Badge
              variant="secondary"
              className={cn(
                "absolute -top-2 -right-2 z-10 uppercase text-xs",
                statusBadgeStyles[status]
              )}
            >
              {status}
            </Badge>
            <ClassDetailView classEntity={classEntity} />
          </div>
        ))}
      </div>
    </div>
  );
}
