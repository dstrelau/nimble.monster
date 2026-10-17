"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSpellSchool } from "@/app/%5Factions/deleteSpellSchool/contract";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { call } from "@/lib/contract";
import type { SpellSchool } from "@/lib/types";

interface SchoolActionsProps {
  spellSchool: SpellSchool;
}

export function SchoolActions({ spellSchool }: SchoolActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    router.push(`/spell-schools/${spellSchool.id}/edit`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await call(deleteSpellSchool, { id: spellSchool.id });
      router.push("/my/spell-schools");
      router.refresh();
    } catch {
      setError("Failed to delete spell school. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2 justify-end">
      {error && <p role="alert">{error}</p>}
      <Button variant="outline" size="sm" onClick={handleEdit}>
        <Pencil className="w-4 h-4" />
        Edit
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={isDeleting}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Spell School</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{spellSchool.name}"? This will
              also delete all spells in this school. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
