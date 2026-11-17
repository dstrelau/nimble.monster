"use client";

import { Palette, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  FIELD_GUIDE_ART_CHOICES,
  type FieldGuideArtOption,
  type FieldGuideArtOptions,
} from "@/components/home/fieldGuideArtOptions";
import { ModeToggle } from "@/components/layout/ModeToggle";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LABELS: Record<FieldGuideArtOption, string> = {
  treatment: "Treatment",
  tint: "Ink color",
  hero: "Hero",
  icons: "Section icons",
  band: "Share band",
};

interface FieldGuideArtPanelProps {
  options: FieldGuideArtOptions;
}

// Temporary design control: remove once an art direction is chosen.
export function FieldGuideArtPanel({ options }: FieldGuideArtPanelProps) {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const choose = (key: FieldGuideArtOption, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  if (!open) {
    return (
      <Button
        className="fixed right-4 bottom-4 z-50 shadow-lg"
        onClick={() => setOpen(true)}
      >
        <Palette aria-hidden="true" /> Art options
      </Button>
    );
  }

  return (
    <aside
      aria-label="Art options"
      className="fixed right-4 bottom-4 z-50 w-80 space-y-3 rounded-lg border border-border bg-card p-4 text-sm shadow-xl"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-card-foreground">Art options</h2>
        <div className="flex items-center gap-1">
          <ModeToggle />
          <Button
            size="icon"
            variant="ghost"
            aria-label="Hide art options"
            onClick={() => setOpen(false)}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>
      {(Object.keys(LABELS) as FieldGuideArtOption[]).map((key) => (
        <div key={key} className="grid grid-cols-[6rem_1fr] items-center gap-2">
          <span id={`art-option-${key}`}>{LABELS[key]}</span>
          <Select value={options[key]} onValueChange={(v) => choose(key, v)}>
            <SelectTrigger
              aria-labelledby={`art-option-${key}`}
              className="w-full min-w-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_GUIDE_ART_CHOICES[key].map((choice) => (
                <SelectItem key={choice.value} value={choice.value}>
                  {choice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </aside>
  );
}
