import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../lib/api";
import { MonsterCardGrid } from "../components/MonsterCard";
import type { Collection } from "../lib/types";
import { useParams } from "react-router-dom";
import { useState } from "react";

const ShowCollectionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showDropdown, setShowDropdown] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["collection", id],
    queryFn: () => fetchApi<Collection>(`/api/collections/${id}`),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div className="container">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{data.name}</h2>
          {data.description && (
            <div className="mt-2 text-gray-600">{data.description}</div>
          )}
        </div>
        <div className="relative">
          <button
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            Export
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <a
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                href={`/api/collections/${id}/download`}
                download={`collection-${id}.json`}
              >
                OBR Compendium
              </a>
            </div>
          )}
        </div>
      </div>
      {data.monsters.length === 0 ? (
        <p>No monsters in this collection.</p>
      ) : (
        <MonsterCardGrid monsters={data.monsters} />
      )}
    </div>
  );
};

export default ShowCollectionView;
