"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSpellSchool } from "@/app/spell-schools/actions";
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
import type { SpellSchool } from "@/lib/types";

interface SchoolActionsProps {
  spellSchool: SpellSchool;
}

export function SchoolActions({ spellSchool }: SchoolActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    router.push(`/spell-schools/${spellSchool.id}/edit`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteSpellSchool(spellSchool.id);
      if (result.success) {
        router.push("/my/spell-schools");
      } else {
        // Handle error - you might want to show a toast or error message
        console.error("Failed to delete spell school:", result.error);
      }
    } catch (error) {
      console.error("Error deleting spell school:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2 justify-end">
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
