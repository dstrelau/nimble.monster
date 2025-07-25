"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Monster } from "@/lib/types";
import type { LegendaryFilter, SortOption } from "@/ui/monster/SimpleFilterBar";

interface UseSimpleMonsterFiltersProps {
  monsters: Monster[];
}

export const useSimpleMonsterFilters = ({
  monsters,
}: UseSimpleMonsterFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state directly from URL params to avoid flash
  const initialSearch = searchParams.get("search") || "";
  const initialLegendary = searchParams.get("legendary");
  const initialSort = (searchParams.get("sort") as SortOption) || "name-asc";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);
  const [legendaryFilter, setLegendaryFilter] = useState<LegendaryFilter>(
    initialLegendary === "true"
      ? "legendary"
      : initialLegendary === "false"
        ? "standard"
        : "all",
  );
  const [sortOption, setSortOption] = useState<SortOption>(
    initialSort &&
      (initialSort.includes("name") ||
        initialSort.includes("level") ||
        initialSort.includes("hp"))
      ? initialSort
      : "name-asc",
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

    // Legendary filter
    if (legendaryFilter === "legendary") {
      params.set("legendary", "true");
    } else if (legendaryFilter === "standard") {
      params.set("legendary", "false");
    } else {
      params.delete("legendary");
    }

    // Sort
    if (sortOption !== "name-asc") {
      params.set("sort", sortOption);
    } else {
      params.delete("sort");
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    debouncedSearchTerm,
    legendaryFilter,
    sortOption,
    pathname,
    router,
    searchParams,
  ]);

  const handleSearch = useCallback((q: string) => {
    setSearchTerm(q);
  }, []);

  const filteredMonsters = useMemo(() => {
    return monsters
      .filter((monster) => {
        // Search filter
        if (
          debouncedSearchTerm &&
          !monster.name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) &&
          !monster.kind
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase())
        ) {
          return false;
        }

        // Legendary filter
        if (legendaryFilter === "legendary" && !monster.legendary) {
          return false;
        }
        if (legendaryFilter === "standard" && monster.legendary) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const [field, direction] = sortOption.split("-");

        if (field === "name") {
          const result = a.name.localeCompare(b.name);
          return direction === "asc" ? result : -result;
        }

        if (field === "level") {
          const levelA = Number.parseFloat(a.level) || 0;
          const levelB = Number.parseFloat(b.level) || 0;
          const result = levelA - levelB;
          return direction === "asc" ? result : -result;
        }

        if (field === "hp") {
          const result = a.hp - b.hp;
          return direction === "asc" ? result : -result;
        }

        return 0;
      });
  }, [monsters, debouncedSearchTerm, legendaryFilter, sortOption]);

  return {
    searchTerm,
    legendaryFilter,
    sortOption,
    filteredMonsters,
    handleSearch,
    setLegendaryFilter,
    setSortOption,
  };
};
