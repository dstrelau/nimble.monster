"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadConditionUsage } from "@/app/%5Factions/conditions/contract";
import { deleteCondition } from "@/app/actions/conditions";
import { ConditionManagementDialog } from "@/components/condition/ConditionManagementDialog";
import { SearchInput } from "@/components/shared/SearchInput";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { CONDITION_USAGE_LABELS, type ConditionUsage } from "@/lib/conditions";
import { call } from "@/lib/contract";
import type { LibraryCondition } from "@/lib/db/condition";

interface ConditionsLibraryProps {
  conditions: LibraryCondition[];
}

interface ConditionCardProps {
  condition: LibraryCondition;
}

function ConditionCard({ condition }: ConditionCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [usage, setUsage] = useState<ConditionUsage | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["conditions"] });
    router.refresh();
  }

  async function confirmDelete() {
    setUsage(null);
    setError("");
    setConfirmOpen(true);
    try {
      setUsage(await call(loadConditionUsage, { id: condition.id }));
    } catch {
      setError("Could not load usage. Close this dialog and try again.");
    }
  }

  async function remove() {
    setPending(true);
    setError("");
    try {
      await deleteCondition(condition.id);
      setConfirmOpen(false);
      await refresh();
    } catch {
      setError("Could not delete condition. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const total = usage
    ? Object.values(usage).reduce((sum, count) => sum + count, 0)
    : 0;
  const usedBy = CONDITION_USAGE_LABELS.flatMap(({ key, singular, plural }) => {
    const count = condition.usage[key];
    return count > 0 ? [`${count} ${count === 1 ? singular : plural}`] : [];
  }).join(", ");
  return (
    <section
      aria-label={condition.name}
      className="rounded-lg border bg-card p-4 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 break-words">
          <h2 className="font-semibold text-lg">{condition.name}</h2>
        </div>
        <div className="flex shrink-0 gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label={`Edit ${condition.name}`}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            </DialogTrigger>
            {editOpen && (
              <ConditionManagementDialog
                condition={condition}
                onSaved={() => setEditOpen(false)}
              />
            )}
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            aria-label={`Delete ${condition.name}`}
            onClick={confirmDelete}
            disabled={pending}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm">{condition.description}</p>
      {usedBy && (
        <p className="text-sm text-muted-foreground">Used by {usedBy}</p>
      )}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!pending) setConfirmOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {condition.name}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Are you sure you want to delete the {condition.name}{" "}
                  condition?
                </p>
                {!usage && <p>Checking how many entities reference it…</p>}
                {usage && total > 0 && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 font-bold text-destructive text-left"
                  >
                    <TriangleAlert
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      {total}{" "}
                      {total === 1
                        ? "entity in your library references"
                        : "entities in your library reference"}{" "}
                      it and will no longer display properly.
                    </span>
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending || !usage}
              onClick={remove}
            >
              {pending ? "Deleting…" : "Delete Condition"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export function ConditionsLibrary({ conditions }: ConditionsLibraryProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const filtered = conditions.filter(
    (condition) =>
      condition.name.toLowerCase().includes(query) ||
      condition.description.toLowerCase().includes(query)
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="size-6 stroke-flame" />
          <h1 className="text-2xl font-bold">My Conditions</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus />
              New Condition
            </Button>
          </DialogTrigger>
          {createOpen && (
            <ConditionManagementDialog onSaved={() => setCreateOpen(false)} />
          )}
        </Dialog>
      </div>
      <SearchInput
        aria-label="Search conditions"
        value={search}
        onChange={setSearch}
      />
      {conditions.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No custom conditions yet. Create a condition to use it in your
          content.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No conditions match your search.
        </p>
      ) : (
        filtered.map((condition) => (
          <ConditionCard key={condition.id} condition={condition} />
        ))
      )}
    </div>
  );
}
