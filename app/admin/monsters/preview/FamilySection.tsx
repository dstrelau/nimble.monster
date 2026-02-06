"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Card } from "@/app/ui/monster/Card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { MonsterWithDiff } from "@/lib/services/monsters/diff";
import { cn } from "@/lib/utils";

interface Family {
  id: string;
  name: string;
  description?: string;
  abilities: Array<{ name: string; description: string }>;
}

interface FamilySectionProps {
  family: Family | null;
  monsters: MonsterWithDiff[];
  hideUnchanged?: boolean;
}

const statusBadgeStyles = {
  new: "bg-green-100 text-green-800 hover:bg-green-100",
  updated: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  unchanged: "bg-gray-100 text-gray-600 hover:bg-gray-100",
};

export function FamilySection({
  family,
  monsters,
  hideUnchanged = false,
}: FamilySectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const title = family?.name || "No Family";
  const filteredMonsters = hideUnchanged
    ? monsters.filter((m) => m.status !== "unchanged")
    : monsters;

  if (filteredMonsters.length === 0) {
    return null;
  }

  const countLabel =
    hideUnchanged && filteredMonsters.length !== monsters.length
      ? `${filteredMonsters.length} of ${monsters.length} monster${monsters.length !== 1 ? "s" : ""}`
      : `${monsters.length} monster${monsters.length !== 1 ? "s" : ""}`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
            <h2 className="text-xl font-semibold">{title}</h2>
            <span className="text-sm text-muted-foreground">
              ({countLabel})
            </span>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4 space-y-6">
            {family && family.abilities.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-muted-foreground">
                  Family Abilities
                </h3>
                <div className="space-y-2">
                  {family.abilities.map((ability) => (
                    <div key={ability.name} className="text-sm">
                      <span className="font-semibold">{ability.name}:</span>{" "}
                      {ability.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMonsters.map(({ monster, status }) => (
                <div
                  key={monster.id}
                  className={cn(
                    "relative",
                    monster.legendary && "lg:col-span-2"
                  )}
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
                  <Card
                    monster={monster}
                    creator={monster.creator}
                    link={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
