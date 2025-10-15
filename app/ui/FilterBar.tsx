"use client";

import type React from "react";
import { SearchInput } from "@/app/ui/SearchInput";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  searchTerm: string | null;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  layout?: "vertical" | "horizontal";
  children?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearch,
  searchPlaceholder = "Search",
  layout = "vertical",
  children,
  className = "",
}) => {
  const containerClass = cn(
    "flex flex-col gap-4",
    layout === "horizontal" && "sm:flex-row"
  );

  const searchContainerClass = layout === "horizontal" ? "flex-1" : "";

  const filtersContainerClass = cn(
    "flex gap-4",
    layout === "horizontal" ? "flex-shrink-0" : "items-center"
  );

  return (
    <div className={cn(containerClass, className)}>
      <div className={searchContainerClass}>
        <SearchInput
          value={searchTerm || ""}
          onChange={onSearch}
          placeholder={searchPlaceholder}
        />
      </div>

      {children && <div className={filtersContainerClass}>{children}</div>}
    </div>
  );
};
