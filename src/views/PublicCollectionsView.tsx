import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchApi } from "../lib/api";
import { CollectionVisibility } from "../lib/types";

interface PublicCollection {
  id: string;
  name: string;
  visibility: CollectionVisibility;
  monstersCount: number;
  legendaryCount: number;
  standardCount: number;
  creator: string;
  creatorName: string;
  creatorAvatar: string;
  creatorDiscordId: string;
}

const PublicCollectionsView: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-collections"],
    queryFn: () => 
      fetchApi<{ collections: PublicCollection[] }>("/api/collections"),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;
  if (!data || data.collections.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Public Collections</h2>
        <p className="text-gray-600">
          No public collections available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Public Collections</h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.collections.map((collection) => (
          <div
            key={collection.id}
            className="collection p-6 border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-all duration-200 hover:border-blue-200"
          >
            <Link to={`/collections/${collection.id}`} className="block">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-900">{collection.name}</h3>
              </div>
              
              <div className="flex items-center mt-3 gap-2">
                <img 
                  src={`https://cdn.discordapp.com/avatars/${collection.creatorDiscordId}/${collection.creatorAvatar}.png`} 
                  alt={collection.creatorName}
                  className="size-6 rounded-full"
                />
                <span className="text-sm text-gray-600">{collection.creatorName}</span>
              </div>
              
              <div className="mt-4 flex justify-between border-t pt-3 border-gray-100">
                <div className="text-sm text-gray-600">
                  {collection.standardCount} standard
                </div>
                <div className="text-sm text-purple-600 font-medium">
                  {collection.legendaryCount} legendary
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicCollectionsView;