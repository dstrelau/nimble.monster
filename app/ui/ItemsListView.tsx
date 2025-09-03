"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { Card } from "@/app/ui/item/Card";
import { useSimpleItemFilters } from "@/lib/hooks/useSimpleItemFilters";
import type { Item } from "@/lib/types";
import { findPublicItem } from "../actions/item";
import { List } from "./item/List";
import { SimpleFilterBar } from "./item/SimpleFilterBar";

interface ItemsListViewProps {
  items: Item[];
  initialSelectedId?: string;
}

export const ItemsListView: React.FC<ItemsListViewProps> = ({
  items,
  initialSelectedId,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    initialSelectedId || null
  );
  const [shouldScrollToSelected, setShouldScrollToSelected] = useState(false);

  const {
    searchTerm,
    sortOption,
    filteredItems,
    shouldClearSelection,
    handleSearch,
    setSortOption,
  } = useSimpleItemFilters({ items, selectedItemId });

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedItemId(initialSelectedId);
    }
  }, [initialSelectedId]);

  useEffect(() => {
    if (!searchParams.get("id")) {
      setSelectedItemId(null);
    }
  }, [searchParams]);

  // Clear selection if the selected item is filtered out
  useEffect(() => {
    if (shouldClearSelection) {
      setSelectedItemId(null);
      const params = new URLSearchParams(searchParams);
      params.delete("id");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [shouldClearSelection, router, pathname, searchParams]);

  // Scroll to selected item on initial load
  useEffect(() => {
    if (selectedItemId) {
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
  }, [selectedItemId]);

  const selectedItem = useQuery({
    queryKey: ["item", selectedItemId],
    queryFn: async () => {
      const { item } = await findPublicItem(selectedItemId || "");
      return item;
    },
    enabled: !!selectedItemId,
    placeholderData: keepPreviousData,
  });

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    const params = new URLSearchParams(searchParams);
    params.set("id", itemId);
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

        {/* Item list */}
        <List
          items={filteredItems}
          selectedIds={selectedItemId ? [selectedItemId] : []}
          handleItemClick={handleItemClick}
          scrollToSelected={shouldScrollToSelected}
        />
      </div>

      {/* Right side: Detail view */}
      <div className="w-full lg:w-2/3">
        {selectedItem.data ? (
          <Card item={selectedItem.data} creator={selectedItem.data.creator} />
        ) : (
          <div className="d-card d-card-bordered bg-base-100 p-8 h-full flex items-center justify-center text-center">
            <Shield className="stroke-muted-foreground" size={96} />
          </div>
        )}
      </div>
    </div>
  );
};
