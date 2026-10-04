"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { CreateEditRandomTable } from "@/app/random-tables/CreateEditRandomTable";
import { SubtablesView } from "@/components/random-table/SubtablesView";
import { Button } from "@/components/ui/button";
import type { RandomTableFormData } from "@/lib/random-table-schema";
import type { RandomTable } from "@/lib/types";
import { STRESS_TEST_TABLE } from "./fixtures";

export function RandomTableLab() {
  const [draft, setDraft] = useState<RandomTable>(STRESS_TEST_TABLE);
  const [showPreview, setShowPreview] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const preview = (data: RandomTableFormData) => {
    setDraft({ ...draft, ...data });
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-slab font-black text-4xl">
          Table editor playground
        </h1>
        <p className="text-muted-foreground">
          Five stress-test tables using the production editor and renderer.
          Changes stay in this browser and are not saved.
        </p>
      </header>
      <div className="flex justify-end gap-2">
        {showPreview && (
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Edit tables
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            setDraft(STRESS_TEST_TABLE);
            setShowPreview(false);
            setResetKey((key) => key + 1);
          }}
        >
          <RotateCcw /> Reset example
        </Button>
      </div>
      {showPreview ? (
        <SubtablesView subtables={draft.subtables} conditions={[]} />
      ) : (
        <CreateEditRandomTable
          key={resetKey}
          randomTable={draft}
          submitLabel="Preview"
          onSubmit={preview}
        />
      )}
    </div>
  );
}
