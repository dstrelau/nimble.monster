"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { createCondition } from "@/app/actions/conditions";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useConditions } from "@/lib/hooks/useConditions";

export function ConditionManagementDialog() {
  const [condition, setCondition] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });
  const queryClient = useQueryClient();
  const { ownConds } = useConditions();
  const id = useId();

  const handleCreateCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!condition?.name.trim() || !condition?.description.trim()) return;

    try {
      await createCondition(condition.name, condition.description);
      queryClient.invalidateQueries({ queryKey: ["conditions"] });
      setCondition({ name: "", description: "" });
    } catch (error) {
      console.error("Failed to create condition:", error);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Manage Conditions</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="max-h-60 overflow-y-auto space-y-2">
          {ownConds.isLoading ? (
            <div>Loading...</div>
          ) : (
            ownConds.data?.map((condition, idx) => (
              <div
                key={`${condition.name}-${idx}`}
                className="border rounded p-2"
              >
                <div className="font-medium">{condition.name}</div>
                <div className="text-sm text-muted-foreground">
                  {condition.description}
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleCreateCondition} className="space-y-3">
          <div>
            <Label htmlFor={`name-${id}`}>Name</Label>
            <Input
              id={`name-${id}`}
              value={condition.name}
              onChange={(e) =>
                setCondition({ ...condition, name: e.target.value })
              }
              placeholder="Condition name"
              required
            />
          </div>
          <div>
            <Label htmlFor={`description-${id}`}>Description</Label>
            <Textarea
              id={`description-${id}`}
              value={condition.description}
              onChange={(e) =>
                setCondition({
                  ...condition,
                  description: e.target.value,
                })
              }
              placeholder="Condition description"
              required
            />
          </div>
          <Button type="submit">Add Condition</Button>
        </form>
      </div>
    </DialogContent>
  );
}
