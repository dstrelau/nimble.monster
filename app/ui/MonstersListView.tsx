"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import type { Monster } from "@/lib/types";
import { Card } from "@/ui/monster/Card";
import { Ghost } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { List } from "./monster/List";
import { SimpleFilterBar } from "./monster/SimpleFilterBar";
import { useSimpleMonsterFilters } from "@/lib/hooks/useSimpleMonsterFilters";

interface MonstersListViewProps {
  monsters: Monster[];
  initialSelectedId?: string;
}

export const MonstersListView: React.FC<MonstersListViewProps> = ({
  monsters,
  initialSelectedId,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(
    initialSelectedId || null,
  );

  const {
    searchTerm,
    legendaryFilter,
    sortOption,
    filteredMonsters,
    handleSearch,
    setLegendaryFilter,
    setSortOption,
  } = useSimpleMonsterFilters({ monsters });

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedMonsterId(initialSelectedId);
    }
  }, [initialSelectedId]);

  useEffect(() => {
    if (!searchParams.get("id")) {
      setSelectedMonsterId(null);
    }
  }, [searchParams]);

  const selectedMonster = useMemo(() => {
    return monsters.find((m) => m.id === selectedMonsterId);
  }, [monsters, selectedMonsterId]);

  const handleMonsterClick = (monsterId: string) => {
    setSelectedMonsterId(monsterId);
    const params = new URLSearchParams(searchParams);
    params.set("id", monsterId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left side: List with filters */}
      <div className="w-full lg:w-1/3 flex flex-col">
        <SimpleFilterBar
          searchTerm={searchTerm}
          legendaryFilter={legendaryFilter}
          sortOption={sortOption}
          onSearch={handleSearch}
          onLegendaryFilterChange={setLegendaryFilter}
          onSortChange={setSortOption}
        />

        {/* Monster list */}
        <List
          monsters={filteredMonsters}
          selectedIds={selectedMonsterId ? [selectedMonsterId] : []}
          handleMonsterClick={handleMonsterClick}
        />
      </div>

      {/* Right side: Detail view */}
      <div className="w-full lg:w-2/3">
        {selectedMonster ? (
          <div className="sticky top-4">
            <Card monster={selectedMonster} creator={selectedMonster.creator} />
          </div>
        ) : (
          <div className="d-card d-card-bordered bg-base-100 p-8 h-full flex items-center justify-center text-center">
            <Ghost className="stroke-base-300" size={96} />
          </div>
        )}
      </div>
    </div>
  );
};
