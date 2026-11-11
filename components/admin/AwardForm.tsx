"use client";

import { Award as AwardIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useId, useRef } from "react";
import {
  type AwardInput,
  createAward,
  updateAward,
} from "@/app/%5Factions/_award/contract";
import {
  AWARD_COLOR_CLASSES,
  AWARD_COLORS,
} from "@/components/award/AwardBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { call } from "@/lib/contract";
import type { Award } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AwardFormProps {
  award?: Award;
  onSaved?: () => void;
  submitLabel?: string;
}

export function AwardForm({
  award,
  onSaved,
  submitLabel = "Create Award",
}: AwardFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_previous: { error: string | null }, formData: FormData) => {
      const input: AwardInput = {
        name: String(formData.get("name") ?? ""),
        abbreviation: String(formData.get("abbreviation") ?? ""),
        description: String(formData.get("description") ?? ""),
        url: String(formData.get("url") ?? ""),
        color: String(formData.get("color") ?? ""),
        icon: String(formData.get("icon") ?? ""),
      };
      try {
        if (award) {
          await call(updateAward, { ...input, id: award.id });
        } else {
          await call(createAward, input);
          formRef.current?.reset();
        }
        router.push("/admin/awards");
        router.refresh();
        onSaved?.();
        return { error: null };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Save failed",
        };
      }
    },
    { error: null }
  );
  const nameId = useId();
  const abbreviationId = useId();
  const descriptionId = useId();
  const urlId = useId();
  const colorId = useId();
  const iconId = useId();

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="space-y-4"
    >
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="space-y-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          name="name"
          defaultValue={award?.name}
          required
          placeholder="Best Monster 2024"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={abbreviationId}>Abbreviation</Label>
        <Input
          id={abbreviationId}
          name="abbreviation"
          defaultValue={award?.abbreviation}
          required
          placeholder="BM24"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={descriptionId}>Description</Label>
        <Textarea
          id={descriptionId}
          name="description"
          defaultValue={award?.description || ""}
          placeholder="Optional description of the award"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={urlId}>URL</Label>
        <Input
          id={urlId}
          name="url"
          type="url"
          defaultValue={award?.url}
          required
          placeholder="https://example.com/awards/bm24"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={colorId}>Color</Label>
        <Select name="color" defaultValue={award?.color || "blue"}>
          <SelectTrigger id={colorId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AWARD_COLORS.map((color) => (
              <SelectItem key={color} value={color}>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "capitalize p-1 rounded border",
                      AWARD_COLOR_CLASSES[color]
                    )}
                  >
                    {color}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={iconId}>Icon</Label>
        <Input
          id={iconId}
          name="icon"
          defaultValue={award?.icon || "award"}
          required
          placeholder="award"
        />
        <p className="text-xs text-muted-foreground">
          Lucide icon name (currently always shows award icon)
        </p>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2"
      >
        <AwardIcon className="size-4" />
        {submitLabel}
      </Button>
    </form>
  );
}
