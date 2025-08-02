"use client";

import { useSimpleMonsterFilters } from "@/lib/hooks/useSimpleMonsterFilters";
import type { Monster } from "@/lib/types";
import { CardGrid } from "./CardGrid";
import { SimpleFilterBar } from "./SimpleFilterBar";

interface FilterableCardGridProps {
  monsters: Monster[];
  hideActions?: boolean;
  currentUserId?: string;
  gridColumns?: { default?: number; sm?: number; md?: number; lg?: number };
}

export const FilterableCardGrid: React.FC<FilterableCardGridProps> = ({
  monsters,
  hideActions = false,
  currentUserId,
  gridColumns = { default: 1, md: 2, lg: 3 },
}) => {
  const {
    searchTerm,
    legendaryFilter,
    sortOption,
    filteredMonsters,
    handleSearch,
    setLegendaryFilter,
    setSortOption,
  } = useSimpleMonsterFilters({ monsters });

  return (
    <div className="space-y-6">
      <SimpleFilterBar
        searchTerm={searchTerm}
        legendaryFilter={legendaryFilter}
        sortOption={sortOption}
        onSearch={handleSearch}
        onLegendaryFilterChange={setLegendaryFilter}
        onSortChange={setSortOption}
      />

      <CardGrid
        monsters={filteredMonsters}
        hideActions={hideActions}
        currentUserId={currentUserId}
        gridColumns={gridColumns}
      />
    </div>
  );
};
