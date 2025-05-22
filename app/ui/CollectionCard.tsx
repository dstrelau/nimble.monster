import type { CollectionOverview } from "@/lib/types";
import { Attribution } from "@/ui/Attribution";
import Link from "next/link";
import { EditDeleteButtons } from "@/ui/CollectionEditDelete";
import React from "react";

export const CollectionCard = ({
  collection,
  showEditDeleteButtons,
  showPublicBadge,
  showAttribution,
}: {
  collection: CollectionOverview;
  showEditDeleteButtons: boolean;
  showPublicBadge: boolean;
  showAttribution: boolean;
}) => {
  return (
    <div
      key={collection.id}
      className="d-card d-card-border d-card-body py-3 px-4 bg-base-100 border-base-300"
    >
      <div className="flex justify-between items-start">
        <Link href={`/collections/${collection.id}`} className="block">
          <h3 className="d-card-title">{collection.name}</h3>
        </Link>
        {showPublicBadge && (
          <div className="d-badge d-badge-soft d-badge-success">Public</div>
        )}
      </div>
      <div className="flex justify-between">
        <div className="font-condensed text-sm text-base-content/50">
          {collection.standardCount} monsters |{" "}
          <span className="text-secondary">
            {collection.legendaryCount} legendary
          </span>
        </div>
      </div>
      {(showAttribution || showEditDeleteButtons) && (
        <>
          <div className="d-divider my-1" />
          <div className="flex justify-between">
            <Attribution user={collection.creator} />
            {showEditDeleteButtons && <EditDeleteButtons id={collection.id} />}
          </div>
        </>
      )}
    </div>
  );
};
