"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SpellSchool, SpellSchoolSortOption } from "@/lib/types";

interface UseSchoolFiltersProps {
  spellSchools: SpellSchool[];
}

export const useSchoolFilters = ({ spellSchools }: UseSchoolFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get("search") || "";
  const initialSort =
    (searchParams.get("sort") as SpellSchoolSortOption) || "created-desc";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);
  const [sortOption, setSortOption] = useState<SpellSchoolSortOption>(
    initialSort &&
      (initialSort.includes("name") || initialSort.includes("created"))
      ? initialSort
      : "created-desc"
  );

  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    const currentSort =
      (searchParams.get("sort") as SpellSchoolSortOption) || "created-desc";

    setSearchTerm(currentSearch);
    setDebouncedSearchTerm(currentSearch);
    setSortOption(currentSort);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (debouncedSearchTerm) {
      params.set("search", debouncedSearchTerm);
    } else {
      params.delete("search");
    }

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

  const filteredSchools = useMemo((): SpellSchool[] => {
    return spellSchools
      .filter((school) => {
        if (debouncedSearchTerm) {
          const searchLower = debouncedSearchTerm.toLowerCase();
          const nameMatch = school.name.toLowerCase().includes(searchLower);
          const descriptionMatch = school.description
            ?.toLowerCase()
            .includes(searchLower);
          const spellMatch = school.spells.some((spell) =>
            spell.name.toLowerCase().includes(searchLower)
          );
          if (!nameMatch && !descriptionMatch && !spellMatch) {
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
          const dateA = a.createdAt || new Date(0);
          const dateB = b.createdAt || new Date(0);
          const result = dateA.getTime() - dateB.getTime();
          return direction === "asc" ? result : -result;
        }

        return 0;
      });
  }, [spellSchools, debouncedSearchTerm, sortOption]);

  return {
    searchTerm,
    sortOption,
    filteredSchools,
    handleSearch,
    setSortOption,
  };
};
