"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CollectionOverview } from "@/lib/types";

export type CollectionSortOption =
  | "name-asc"
  | "name-desc"
  | "created-asc"
  | "created-desc";

interface UseCollectionFiltersProps {
  collections: CollectionOverview[];
}

export const useCollectionFilters = ({
  collections,
}: UseCollectionFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state directly from URL params
  const initialSearch = searchParams.get("search") || "";
  const initialSort =
    (searchParams.get("sort") as CollectionSortOption) || "created-desc";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);
  const [sortOption, setSortOption] = useState<CollectionSortOption>(
    initialSort &&
      (initialSort.includes("name") || initialSort.includes("created"))
      ? initialSort
      : "created-desc"
  );

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    // Search term
    if (debouncedSearchTerm) {
      params.set("search", debouncedSearchTerm);
    } else {
      params.delete("search");
    }

    // Sort
    if (sortOption !== "created-desc") {
      params.set("sort", sortOption);
    } else {
      params.delete("sort");
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debouncedSearchTerm, sortOption, pathname, router, searchParams]);

  const handleSearch = useCallback((q: string) => {
    setSearchTerm(q);
  }, []);

  const filteredCollections = useMemo((): CollectionOverview[] => {
    return collections
      .filter((collection) => {
        // Search filter - search by name and description
        if (debouncedSearchTerm) {
          const searchLower = debouncedSearchTerm.toLowerCase();
          const nameMatch = collection.name.toLowerCase().includes(searchLower);
          if (!nameMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const [field, direction] = sortOption.split("-");

        if (field === "name") {
          const result = a.name.localeCompare(b.name);
          return direction === "asc" ? result : -result;
        }

        if (field === "created") {
          // Use current date as fallback if createdAt is missing
          const dateA = a.createdAt || new Date(0);
          const dateB = b.createdAt || new Date(0);
          const result = dateA.getTime() - dateB.getTime();
          return direction === "asc" ? result : -result;
        }

        return 0;
      });
  }, [collections, debouncedSearchTerm, sortOption]);

  return {
    searchTerm,
    sortOption,
    filteredCollections,
    handleSearch,
    setSortOption,
  };
};
