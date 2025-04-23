import { fetchApi } from "@/lib/api";
import { Family } from "@/lib/types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Pencil, Trash } from "lucide-react";

export const EditDeleteButtons = ({
  family,
  onEdit,
}: {
  family: Family;
  onEdit: () => void;
}) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationKey: ["deleteFamily", family.id],
    mutationFn: () =>
      fetchApi(`/api/families/${family.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
    },
  });

  return (
    <div className="flex flex-col items-end">
      <div className="flex flex-row space-x-2">
        <button
          onClick={onEdit}
          className="w-4 pr-2 cursor-pointer"
          title="Edit family"
        >
          <Pencil className="w-5 h-5 text-slate-500" />
        </button>
        <button
          onClick={() => {
            if (window.confirm("Are you sure?")) {
              deleteMutation.mutate();
            }
          }}
          className={`w-4 pr-2 cursor-pointer ${family.monsterCount && family.monsterCount > 0 && "d-tooltip"}`}
          disabled={
            (family.monsterCount && family.monsterCount > 0) ||
            deleteMutation.isPending
          }
          data-tip="Cannot delete: family has monsters"
          data-popover-target={
            family.monsterCount && family.monsterCount > 0
              ? "popover-default"
              : ""
          }
        >
          <Trash
            className={`w-5 h-5 ${family.monsterCount && family.monsterCount > 0 ? "text-slate-300" : "text-slate-500"}`}
          />
        </button>
      </div>
    </div>
  );
};
