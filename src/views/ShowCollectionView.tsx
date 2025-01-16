import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../lib/api";
import MonsterCard from "../components/MonsterCard";
import { Collection } from "../lib/types";
import { useParams } from "react-router-dom";

const ShowCollectionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["collection", id],
    queryFn: () => fetchApi<Collection>(`/api/collections/${id}`),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div className="container">
      <h2 className="text-2xl font-bold text-gray-800">{data.name}</h2>
      {data.monsters.length === 0 ? (
        <p>No monsters in this collection.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.monsters.map((monster) => (
            <MonsterCard key={monster.id} monster={monster} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ShowCollectionView;
