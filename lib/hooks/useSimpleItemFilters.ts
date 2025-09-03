import { useMemo, useState } from "react";
import type { SortOption } from "@/app/ui/item/SimpleFilterBar";
import type { Item } from "@/lib/types";

interface UseSimpleItemFiltersProps {
  items: Item[];
  selectedItemId?: string | null;
}

export const useSimpleItemFilters = ({
  items,
  selectedItemId,
}: UseSimpleItemFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const { filteredItems, shouldClearSelection } = useMemo(() => {
    let filtered = items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kind?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort items
    filtered = filtered.sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "kind-asc":
          return (a.kind || "").localeCompare(b.kind || "");
        case "kind-desc":
          return (b.kind || "").localeCompare(a.kind || "");
        default:
          return 0;
      }
    });

    const shouldClearSelection = selectedItemId
      ? !filtered.find((item) => item.id === selectedItemId)
      : false;

    return { filteredItems: filtered, shouldClearSelection };
  }, [items, searchTerm, sortOption, selectedItemId]);

  return {
    searchTerm,
    sortOption,
    filteredItems,
    shouldClearSelection,
    handleSearch,
    setSortOption,
  };
};
