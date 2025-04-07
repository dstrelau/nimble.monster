"use client";

import { fetchApi } from "@/lib/api";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const EditDeleteButtons = ({ id }: { id: string }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationKey: ["deleteCollection", id],
    mutationFn: () => fetchApi(`/api/collections/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  return (
    <div className="flex flex-row justify-end">
      <Link href={`/my/collections/${id}/edit`} className="mr-2">
        <PencilIcon className="translate-y-[2px] w-5 h-5 text-slate-500" />
      </Link>
      <button
        className="cursor-pointer"
        onClick={(e) => {
          if (window.confirm("Really? This is permanent.")) {
            e.preventDefault();
            deleteMutation.mutate();
            router.refresh();
          }
        }}
      >
        <TrashIcon className="w-5 h-5 text-slate-500" />
      </button>
    </div>
  );
};
