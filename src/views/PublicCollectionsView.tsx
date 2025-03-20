import { useQuery } from "@tanstack/react-query";

import { fetchApi } from "../lib/api";
import type { CollectionOverview } from "../lib/types";
import { CollectionCard } from "@/components/CollectionCard";

const PublicCollectionsView: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-collections"],
    queryFn: () =>
      fetchApi<{ collections: CollectionOverview[] }>("/api/collections"),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;
  if (!data || data.collections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No public collections available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            showEditDeleteButtons={false}
            showPublicBadge={false}
          />
        ))}
      </div>
    </div>
  );
};

export default PublicCollectionsView;
