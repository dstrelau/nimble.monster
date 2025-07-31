"use client";

import { Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { deleteCollection } from "@/app/actions/collection";

export const EditDeleteButtons = ({ id }: { id: string }) => {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-row justify-end">
      <Link href={`/my/collections/${id}/edit`} className="mr-2">
        <Pencil className="translate-y-[2px] w-5 h-5 text-slate-500" />
      </Link>
      <button
        type="button"
        className="cursor-pointer"
        disabled={isPending}
        onClick={(e) => {
          if (window.confirm("Really? This is permanent.")) {
            e.preventDefault();
            startTransition(async () => {
              const result = await deleteCollection(id);
              if (!result.success && result.error) {
                alert(`Error deleting collection: ${result.error}`);
              }
            });
          }
        }}
      >
        <Trash
          className={`w-5 h-5 ${isPending ? "text-slate-300" : "text-slate-500"}`}
        />
      </button>
    </div>
  );
};
