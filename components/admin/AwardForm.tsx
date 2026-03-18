"use client";

import { Award as AwardIcon } from "lucide-react";
import { useActionState, useId } from "react";
import { AWARD_COLOR_CLASSES, AWARD_COLORS } from "@/components/AwardBadge";
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
import type { Award } from "@/lib/types";
import { cn } from "@/lib/utils";

type AwardFormAction = (
  prevState: { error: string | null },
  formData: FormData
) => Promise<{ error: string | null }>;

interface AwardFormProps {
  award?: Award;
  onSubmit: AwardFormAction;
  submitLabel?: string;
}

export function AwardForm({
  award,
  onSubmit,
  submitLabel = "Create Award",
}: AwardFormProps) {
  const [state, formAction] = useActionState(onSubmit, { error: null });
  const nameId = useId();
  const abbreviationId = useId();
  const descriptionId = useId();
  const urlId = useId();
  const colorId = useId();
  const iconId = useId();

  return (
    <form action={formAction} className="space-y-4">
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

      <Button type="submit" className="flex items-center gap-2">
        <AwardIcon className="size-4" />
        {submitLabel}
      </Button>
    </form>
  );
}
