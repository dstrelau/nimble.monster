"use client";

import type React from "react";
import { CollectionCard } from "@/app/ui/CollectionCard";
import { useCollectionFilters } from "@/lib/hooks/useCollectionFilters";
import type { CollectionOverview } from "@/lib/types";
import { CollectionFilterBar } from "./CollectionFilterBar";

interface CollectionsListViewProps {
  collections: CollectionOverview[];
}

export const CollectionsListView: React.FC<CollectionsListViewProps> = ({
  collections,
}) => {
  const {
    searchTerm,
    sortOption,
    filteredCollections,
    handleSearch,
    setSortOption,
  } = useCollectionFilters({ collections });

  return (
    <div className="space-y-6">
      <CollectionFilterBar
        searchTerm={searchTerm}
        sortOption={sortOption}
        onSearch={handleSearch}
        onSortChange={setSortOption}
      />

      {filteredCollections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {searchTerm
              ? `No collections found matching "${searchTerm}".`
              : "No collections found."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {filteredCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
};
