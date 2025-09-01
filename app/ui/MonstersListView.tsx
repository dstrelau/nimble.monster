"use client";

import { useQuery } from "@tanstack/react-query";
import { Ghost } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { Card } from "@/app/ui/monster/Card";
import { useSimpleMonsterFilters } from "@/lib/hooks/useSimpleMonsterFilters";
import type { MonsterMini } from "@/lib/types";
import { findPublicMonster } from "../actions/monster";
import { List } from "./monster/List";
import { SimpleFilterBar } from "./monster/SimpleFilterBar";

interface MonstersListViewProps {
  monsters: MonsterMini[];
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
    initialSelectedId || null
  );
  const [shouldScrollToSelected, setShouldScrollToSelected] = useState(false);

  const {
    searchTerm,
    legendaryFilter,
    sortOption,
    filteredMonsters,
    shouldClearSelection,
    handleSearch,
    setLegendaryFilter,
    setSortOption,
  } = useSimpleMonsterFilters({ monsters, selectedMonsterId });

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

  // Clear selection if the selected monster is filtered out
  useEffect(() => {
    if (shouldClearSelection) {
      setSelectedMonsterId(null);
      const params = new URLSearchParams(searchParams);
      params.delete("id");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [shouldClearSelection, router, pathname, searchParams]);

  // Scroll to selected monster on initial load
  useEffect(() => {
    if (selectedMonsterId) {
      const timer = setTimeout(() => {
        setShouldScrollToSelected(true);
        const clearTimer = setTimeout(
          () => setShouldScrollToSelected(false),
          100
        );
        return () => clearTimeout(clearTimer);
      }, 100); // Small delay to ensure list is rendered
      return () => clearTimeout(timer);
    }
  }, [selectedMonsterId]);

  const selectedMonster = useQuery({
    queryKey: ["monster", selectedMonsterId],
    queryFn: async () => {
      const { monster } = await findPublicMonster(selectedMonsterId || "");
      return monster;
    },
    enabled: !!selectedMonsterId,
  });

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
          scrollToSelected={shouldScrollToSelected}
        />
      </div>

      {/* Right side: Detail view */}
      <div className="w-full lg:w-2/3">
        {selectedMonster.data ? (
          <div className="sticky top-4">
            <Card
              monster={selectedMonster.data}
              creator={selectedMonster.data.creator}
            />
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
