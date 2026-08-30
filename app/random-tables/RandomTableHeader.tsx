"use client";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteRandomTable } from "@/app/%5Factions/_random-tables/contract";
import { Attribution } from "@/components/shared/Attribution";
import { FormattedText } from "@/components/shared/FormattedText";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { Button } from "@/components/ui/button";
import { call } from "@/lib/contract";
import type { Condition, RandomTable } from "@/lib/types";
import { getRandomTableEditUrl } from "@/lib/utils/url";

interface RandomTableHeaderProps {
  randomTable: RandomTable;
  showEditDeleteButtons?: boolean;
  conditions: Condition[];
}

export function RandomTableHeader({
  randomTable,
  showEditDeleteButtons = false,
  conditions,
}: RandomTableHeaderProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${randomTable.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await call(deleteRandomTable, { id: randomTable.id });
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete random table."
      );
      setIsDeleting(false);
      return;
    }

    router.push("/my/random-tables");
  };

  return (
    <div className="mb-6 flex items-start justify-between">
      <div className="w-full">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-black text-3xl">{randomTable.name}</h1>
            {randomTable.visibility === "private" && (
              <VisibilityBadge
                visibility={randomTable.visibility}
                className="my-1"
              />
            )}
          </div>
          <div className="flex gap-2 print:hidden">
            {showEditDeleteButtons && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={getRandomTableEditUrl(randomTable)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
        {randomTable.creator && (
          <div className="mt-2 flex">
            <Attribution user={randomTable.creator} />
          </div>
        )}
        {randomTable.description && (
          <FormattedText
            className="mt-2"
            content={randomTable.description}
            conditions={conditions}
          />
        )}
      </div>
    </div>
  );
}
