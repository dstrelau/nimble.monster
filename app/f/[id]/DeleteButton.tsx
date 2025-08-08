"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FamilyHeader } from "@/components/FamilyHeader";
import { deleteFamily } from "@/app/actions/family";
import type { Family } from "@/lib/types";

interface DeleteButtonProps {
  family: Family;
  showEditButton: boolean;
  editHref?: string;
}

export function FamilyHeaderWithDelete({
  family,
  showEditButton,
  editHref,
}: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${family.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const result = await deleteFamily(family.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete family");
      }

      router.push("/my/families");
    } catch (error) {
      console.error("Error deleting family:", error);
      alert("Failed to delete family. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <FamilyHeader
      family={family}
      showEditButton={showEditButton}
      editHref={editHref}
      showDeleteButton={showEditButton}
      onDelete={isDeleting ? undefined : handleDelete}
    />
  );
}