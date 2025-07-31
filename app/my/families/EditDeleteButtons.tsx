import { Pencil, Trash } from "lucide-react";
import { useTransition } from "react";
import { deleteFamily } from "@/app/actions/family";
import type { Family } from "@/lib/types";

export const EditDeleteButtons = ({
  family,
  onEdit,
}: {
  family: Family;
  onEdit: () => void;
}) => {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end">
      <div className="flex flex-row space-x-2">
        <button
          type="button"
          onClick={onEdit}
          className="w-4 pr-2 cursor-pointer"
          title="Edit family"
        >
          <Pencil className="w-5 h-5 text-slate-500" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Are you sure?")) {
              startTransition(() => {
                deleteFamily(family.id);
              });
            }
          }}
          className={`w-4 pr-2 cursor-pointer ${family.monsterCount && family.monsterCount > 0 && "d-tooltip"}`}
          disabled={
            (family.monsterCount && family.monsterCount > 0) || isPending
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
