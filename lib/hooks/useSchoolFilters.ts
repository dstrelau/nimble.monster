"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo } from "react";
import type { SpellSchool, SpellSchoolSortOption } from "@/lib/types";

const SpellSchoolSortOptions = [
  "name-asc",
  "name-desc",
  "created-asc",
  "created-desc",
] as const;

interface UseSchoolFiltersProps {
  spellSchools: SpellSchool[];
}

export const useSchoolFilters = ({ spellSchools }: UseSchoolFiltersProps) => {
  const [rawSearchTerm, setSearchTerm] = useQueryState("search");
  const [searchTerm] = useDebouncedValue(rawSearchTerm, { wait: 250 });

  const [sortOption, setSortOption] = useQueryState(
    "sort",
    parseAsStringLiteral(SpellSchoolSortOptions).withDefault("created-desc")
  );
  const [source, setSource] = useQueryState("source", parseAsString);

  const filteredSchools = useMemo((): SpellSchool[] => {
    return spellSchools
      .filter((school) => {
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
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

        if (source) {
          if (school.source?.abbreviation !== source) return false;
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
  }, [spellSchools, searchTerm, sortOption, source]);

  const handleSearch = (q: string | null) => {
    setSearchTerm(q);
  };

  return {
    searchTerm: rawSearchTerm,
    sortOption: sortOption as SpellSchoolSortOption,
    source,
    filteredSchools,
    handleSearch,
    setSortOption,
    setSource,
  };
};
