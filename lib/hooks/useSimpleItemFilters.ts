import { useMemo, useState } from "react";
import type { SortOption } from "@/app/ui/item/SimpleFilterBar";
import type { Item, ItemRarity } from "@/lib/services/items";

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
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | null>(null);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleRarityChange = (rarity: ItemRarity | null) => {
    setRarityFilter(rarity);
  };

  const { filteredItems, shouldClearSelection } = useMemo(() => {
    let filtered = items.filter(
      (item) =>
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.kind?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!rarityFilter || item.rarity === rarityFilter)
    );

    // Sort items
    filtered = filtered.sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    const shouldClearSelection = selectedItemId
      ? !filtered.find((item) => item.id === selectedItemId)
      : false;

    return { filteredItems: filtered, shouldClearSelection };
  }, [items, searchTerm, sortOption, rarityFilter, selectedItemId]);

  return {
    searchTerm,
    sortOption,
    rarityFilter,
    filteredItems,
    shouldClearSelection,
    handleSearch,
    setSortOption,
    handleRarityChange,
  };
};
