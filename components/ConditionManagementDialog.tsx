"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createCondition, loadOwnConditions } from "@/app/actions/conditions";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ConditionManagementDialog() {
  const [condition, setCondition] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ["own-conditions"],
    queryFn: loadOwnConditions,
    staleTime: 60 * 1000,
  });

  const handleCreateCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!condition?.name.trim() || !condition?.description.trim()) return;

    try {
      await createCondition(condition.name, condition.description);
      queryClient.invalidateQueries({ queryKey: ["own-conditions"] });
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
          {result.isLoading ? (
            <div>Loading...</div>
          ) : (
            result.data?.map((condition, idx) => (
              <div key={idx} className="border rounded p-2">
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
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={condition.name}
              onChange={(e) =>
                setCondition({ ...condition, name: e.target.value })
              }
              placeholder="Condition name"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
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
