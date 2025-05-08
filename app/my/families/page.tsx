"use client";

import { fetchApi } from "@/lib/api";
import type { Family } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { FamilyCard } from "./FamilyCard";
import { NewFamilyForm } from "./NewFamilyForm";

export default function MyFamiliesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["families"],
    queryFn: () => fetchApi<{ families: Family[] }>("/api/users/me/families"),
    staleTime: 0,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading families: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-6">
      <NewFamilyForm />

      {!data || data.families.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            Families allow associating one or more abilities with a group of
            related monsters.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 items-start md:grid-cols-2 lg:grid-cols-3">
          {data.families.map((family) => (
            <FamilyCard key={family.id} family={family} />
          ))}
        </div>
      )}
    </div>
  );
}
