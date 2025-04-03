"use client";

import { MonsterCardGrid } from "@/ui/MonsterCard";
import MonsterList from "@/ui/MonsterList";
import { fetchApi } from "@/lib/api";
import { Monster } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export type MonsterDisplay = "card" | "list";

export default function MostersPage() {
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
        <MonsterCardGrid monsters={data.monsters} showActions={false} />
      )}
    </div>
  );
}
