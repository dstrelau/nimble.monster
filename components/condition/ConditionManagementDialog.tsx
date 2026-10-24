"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { updateCondition } from "@/app/%5Factions/conditions/contract";
import { createCondition } from "@/app/%5Factions/createCondition/contract";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { call } from "@/lib/contract";
import type { Condition } from "@/lib/types";

interface ConditionManagementDialogProps {
  condition?: Condition;
  onSaved: () => void;
}

export function ConditionManagementDialog({
  condition,
  onSaved,
}: ConditionManagementDialogProps) {
  const [name, setName] = useState(condition?.name ?? "");
  const [description, setDescription] = useState(condition?.description ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();
  const id = useId();

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      if (condition) {
        await call(updateCondition, { id: condition.id, description });
      } else {
        await call(createCondition, { name, description });
      }
      await queryClient.invalidateQueries({ queryKey: ["conditions"] });
      router.refresh();
      onSaved();
    } catch {
      setError(
        condition
          ? "Could not save condition. Please try again."
          : "Could not create condition. Use a unique name without brackets or pipes and a non-empty description."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <DialogContent aria-describedby={undefined}>
      <DialogHeader>
        <DialogTitle>
          {condition ? "Edit Condition" : "New Condition"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor={`name-${id}`}>Name</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  aria-label="About condition names"
                >
                  <Info className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" align="start" className="max-w-64">
                Names cannot be changed after creation.
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id={`name-${id}`}
            autoFocus={!condition}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
            disabled={pending || !!condition}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`description-${id}`}>Description</Label>
          <Textarea
            id={`description-${id}`}
            autoFocus={!!condition}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            required
            disabled={pending}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={pending || !name.trim() || !description.trim()}
          >
            {pending
              ? condition
                ? "Saving…"
                : "Creating…"
              : condition
                ? "Save changes"
                : "Create Condition"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
