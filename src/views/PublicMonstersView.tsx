import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { fetchApi } from "../lib/api";
import type { Monster } from "../lib/types";
import MonsterCard from "../components/MonsterCard";
import MonsterList from "../components/MonsterList";

export type MonsterDisplay = "card" | "list";

const PublicMonstersView = () => {
  const [display] = useState<MonsterDisplay>("card");

  const { data, isLoading, error } = useQuery({
    queryKey: ["monsters"],
    queryFn: () => fetchApi<{ monsters: Monster[] }>("/api/monsters"),
    staleTime: 0,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading monsters: {error.message}</div>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      {display === "list" ? (
        <MonsterList monsters={data.monsters} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.monsters.map((monster) => (
            <MonsterCard key={monster.id} monster={monster} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicMonstersView;
