"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Subclass, SubclassSortOption } from "@/lib/types";

interface UseSubclassFiltersProps {
  subclasses: Subclass[];
}

export const useSubclassFilters = ({ subclasses }: UseSubclassFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state directly from URL params
  const initialSearch = searchParams.get("search") || "";
  const initialSort =
    (searchParams.get("sort") as SubclassSortOption) || "created-desc";
  const initialClassName = searchParams.get("className") || "all";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);
  const [sortOption, setSortOption] = useState<SubclassSortOption>(
    initialSort &&
      (initialSort.includes("name") || initialSort.includes("created"))
      ? initialSort
      : "created-desc"
  );
  const [classNameFilter, setClassNameFilter] =
    useState<string>(initialClassName);

  // Sync state with URL params when they change (e.g., browser back/forward)
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    const currentSort =
      (searchParams.get("sort") as SubclassSortOption) || "created-desc";
    const currentClassName = searchParams.get("className") || "all";

    setSearchTerm(currentSearch);
    setDebouncedSearchTerm(currentSearch);
    setSortOption(currentSort);
    setClassNameFilter(currentClassName);
  }, [searchParams]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    // Search term
    if (debouncedSearchTerm) {
      params.set("search", debouncedSearchTerm);
    } else {
      params.delete("search");
    }

    // Sort
    if (sortOption !== "created-desc") {
      params.set("sort", sortOption);
    } else {
      params.delete("sort");
    }

    // Class name filter
    if (classNameFilter && classNameFilter !== "all") {
      params.set("className", classNameFilter);
    } else {
      params.delete("className");
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    debouncedSearchTerm,
    sortOption,
    classNameFilter,
    pathname,
    router,
    searchParams,
  ]);

  const handleSearch = useCallback((q: string) => {
    setSearchTerm(q);
  }, []);

  const filteredSubclasses = useMemo((): Subclass[] => {
    return subclasses
      .filter((subclass) => {
        // Search filter - search by name and description
        if (debouncedSearchTerm) {
          const searchLower = debouncedSearchTerm.toLowerCase();
          const nameMatch = subclass.name.toLowerCase().includes(searchLower);
          const descriptionMatch = subclass.description
            ?.toLowerCase()
            .includes(searchLower);
          if (!nameMatch && !descriptionMatch) {
            return false;
          }
        }

        // Class name filter
        if (classNameFilter && classNameFilter !== "all") {
          if (subclass.className !== classNameFilter) {
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
          // Use current date as fallback if createdAt is missing
          const dateA = a.createdAt || new Date(0);
          const dateB = b.createdAt || new Date(0);
          const result = dateA.getTime() - dateB.getTime();
          return direction === "asc" ? result : -result;
        }

        return 0;
      });
  }, [subclasses, debouncedSearchTerm, sortOption, classNameFilter]);

  return {
    searchTerm,
    sortOption,
    classNameFilter,
    filteredSubclasses,
    handleSearch,
    setSortOption,
    setClassNameFilter,
  };
};
