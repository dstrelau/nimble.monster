"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SpellSchool } from "@/lib/types";
import { Card } from "./Card";

interface MySpellsViewProps {
  spellSchools: SpellSchool[];
}

export function MySpellsView({ spellSchools }: MySpellsViewProps) {
  return (
    <div className="space-y-6">
      {spellSchools.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">
            You haven't created any spell schools yet.
          </p>
          <Button asChild>
            <Link href="/spell-schools/new">Create Your First School</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {spellSchools.map((school) => (
            <Card key={school.id} spellSchool={school} mini={true} />
          ))}
        </div>
      )}
    </div>
  );
}
