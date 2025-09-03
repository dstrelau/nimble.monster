import { useMemo, useState } from "react";
import type { SortOption } from "@/app/ui/companion/SimpleFilterBar";
import type { Companion } from "@/lib/types";

interface UseSimpleCompanionFiltersProps {
  companions: Companion[];
  selectedCompanionId?: string | null;
}

export const useSimpleCompanionFilters = ({
  companions,
  selectedCompanionId,
}: UseSimpleCompanionFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const { filteredCompanions, shouldClearSelection } = useMemo(() => {
    let filtered = companions.filter(
      (companion) =>
        companion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        companion.kind.toLowerCase().includes(searchTerm.toLowerCase()) ||
        companion.class.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort companions
    filtered = filtered.sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "kind-asc":
          return a.kind.localeCompare(b.kind);
        case "kind-desc":
          return b.kind.localeCompare(a.kind);
        case "class-asc":
          return a.class.localeCompare(b.class);
        case "class-desc":
          return b.class.localeCompare(a.class);
        default:
          return 0;
      }
    });

    const shouldClearSelection = selectedCompanionId
      ? !filtered.find((companion) => companion.id === selectedCompanionId)
      : false;

    return { filteredCompanions: filtered, shouldClearSelection };
  }, [companions, searchTerm, sortOption, selectedCompanionId]);

  return {
    searchTerm,
    sortOption,
    filteredCompanions,
    shouldClearSelection,
    handleSearch,
    setSortOption,
  };
};
