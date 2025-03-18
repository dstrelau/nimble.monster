import { fetchApi } from "@/lib/api";
import type { CollectionOverview } from "@/lib/types";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

export const CollectionCard = ({
  collection,
  showEditDeleteButtons,
  showPublicBadge,
}: {
  collection: CollectionOverview;
  showEditDeleteButtons: boolean;
  showPublicBadge: boolean;
}) => {
  return (
    <div
      key={collection.id}
      className="d-card d-card-border d-card-body bg-base-100 border-base-300 py-4"
    >
      <Link to={`/collections/${collection.id}`} className="block">
        <div className="flex justify-between items-start">
          <h3 className="d-card-title">{collection.name}</h3>
          {showPublicBadge && (
            <div className="d-badge d-badge-soft d-badge-success">Public</div>
          )}
        </div>
        <div className="flex items-center mt-3 gap-2">
          <img
            src={`https://cdn.discordapp.com/avatars/${collection.creator.discordId}/${collection.creator.avatar}.png`}
            alt={collection.creator.username}
            className="size-6 rounded-full"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {collection.creator.username}
          </span>
        </div>
        <div className="d-divider my-2"></div>
        <div className="flex justify-between">
          <div className="font-condensed text-sm text-gray-600 dark:text-gray-400">
            {collection.standardCount} monsters |{" "}
            <span className="text-info">
              {collection.legendaryCount} legendary
            </span>
          </div>
          <div className="flex justify-end">
            {showEditDeleteButtons && <EditDeleteButtons id={collection.id} />}
          </div>
        </div>
      </Link>
    </div>
  );
};

const EditDeleteButtons = ({ id }: { id: string }) => {
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
      <Link to={`/my/collections/${id}/edit`} className="mr-2">
        <PencilIcon className="w-5 h-5 text-slate-500" />
      </Link>
      <button
        onClick={() => {
          if (window.confirm("Really? This is permanent.")) {
            deleteMutation.mutate();
          }
        }}
      >
        <TrashIcon className="w-5 h-5 text-slate-500" />
      </button>
    </div>
  );
};
