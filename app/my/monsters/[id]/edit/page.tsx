"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Monster } from "@/lib/types";
import BuildMonster from "@/ui/BuildMonsterView";
import React from "react";

export default function EditMonsterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data: monster, isLoading } = useQuery({
    queryKey: ["monster", id],
    queryFn: () => fetchApi<Monster>(`/api/monsters/${id}`),
    enabled: !!id,
  });

  if (!id) {
    return <div>Monster ID is required</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!monster) {
    return <div>Monster not found</div>;
  }

  return <BuildMonster existingMonster={monster} />;
}
