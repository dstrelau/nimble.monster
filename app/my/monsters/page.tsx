"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { fetchApi } from "@/lib/api";
import type { Monster } from "@/lib/types";
import { MonsterCardGrid } from "@/ui/MonsterCard";

export type MonsterDisplay = "card" | "list" | "table";

export default function MyMonstersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["monsters"],
    queryFn: () => fetchApi<{ monsters: Monster[] }>("/api/users/me/monsters"),
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
      <MonsterCardGrid monsters={data.monsters} showActions={true} />
    </div>
  );
}
