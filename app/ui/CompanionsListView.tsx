"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { HeartHandshake } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { Card } from "@/app/ui/companion/Card";
import { useSimpleCompanionFilters } from "@/lib/hooks/useSimpleCompanionFilters";
import type { Companion } from "@/lib/types";
import { findPublicCompanion } from "../actions/companion";
import { List } from "./companion/List";
import { SimpleFilterBar } from "./companion/SimpleFilterBar";

interface CompanionsListViewProps {
  companions: Companion[];
  initialSelectedId?: string;
}

export const CompanionsListView: React.FC<CompanionsListViewProps> = ({
  companions,
  initialSelectedId,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedCompanionId, setSelectedCompanionId] = useState<string | null>(
    initialSelectedId || null
  );
  const [shouldScrollToSelected, setShouldScrollToSelected] = useState(false);

  const {
    searchTerm,
    sortOption,
    filteredCompanions,
    shouldClearSelection,
    handleSearch,
    setSortOption,
  } = useSimpleCompanionFilters({ companions, selectedCompanionId });

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedCompanionId(initialSelectedId);
    }
  }, [initialSelectedId]);

  useEffect(() => {
    if (!searchParams.get("id")) {
      setSelectedCompanionId(null);
    }
  }, [searchParams]);

  // Clear selection if the selected companion is filtered out
  useEffect(() => {
    if (shouldClearSelection) {
      setSelectedCompanionId(null);
      const params = new URLSearchParams(searchParams);
      params.delete("id");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [shouldClearSelection, router, pathname, searchParams]);

  // Scroll to selected companion on initial load
  useEffect(() => {
    if (selectedCompanionId) {
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
  }, [selectedCompanionId]);

  const selectedCompanion = useQuery({
    queryKey: ["companion", selectedCompanionId],
    queryFn: async () => {
      const { companion } = await findPublicCompanion(
        selectedCompanionId || ""
      );
      return companion;
    },
    enabled: !!selectedCompanionId,
    placeholderData: keepPreviousData,
  });

  const handleCompanionClick = (companionId: string) => {
    setSelectedCompanionId(companionId);
    const params = new URLSearchParams(searchParams);
    params.set("id", companionId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left side: List with filters */}
      <div className="w-full lg:w-1/3 flex flex-col">
        <SimpleFilterBar
          searchTerm={searchTerm}
          sortOption={sortOption}
          onSearch={handleSearch}
          onSortChange={setSortOption}
        />

        {/* Companion list */}
        <List
          companions={filteredCompanions}
          selectedIds={selectedCompanionId ? [selectedCompanionId] : []}
          handleCompanionClick={handleCompanionClick}
          scrollToSelected={shouldScrollToSelected}
        />
      </div>

      {/* Right side: Detail view */}
      <div className="w-full lg:w-2/3">
        {selectedCompanion.data ? (
          <div className="sticky top-4">
            <Card
              companion={selectedCompanion.data}
              creator={selectedCompanion.data.creator}
            />
          </div>
        ) : (
          <div className="d-card d-card-bordered bg-base-100 p-8 h-full flex items-center justify-center text-center">
            <HeartHandshake className="stroke-muted-foreground" size={96} />
          </div>
        )}
      </div>
    </div>
  );
};
