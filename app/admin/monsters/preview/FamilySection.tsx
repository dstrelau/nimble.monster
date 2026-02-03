"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Card } from "@/app/ui/monster/Card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Monster } from "@/lib/services/monsters/types";

interface Family {
  id: string;
  name: string;
  description?: string;
  abilities: Array<{ name: string; description: string }>;
}

interface FamilySectionProps {
  family: Family | null;
  monsters: Monster[];
}

export function FamilySection({ family, monsters }: FamilySectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const title = family?.name || "No Family";

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
              ({monsters.length} monster{monsters.length !== 1 ? "s" : ""})
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
              {monsters.map((monster) => (
                <Card
                  key={monster.id}
                  monster={monster}
                  creator={monster.creator}
                  link={false}
                />
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
