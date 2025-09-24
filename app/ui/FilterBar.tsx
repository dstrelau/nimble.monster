"use client";

import type React from "react";
import { SearchInput } from "@/app/ui/SearchInput";

interface FilterBarProps {
  searchTerm: string;
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
  const containerClass =
    layout === "horizontal"
      ? "flex flex-col sm:flex-row gap-3 pb-4"
      : "flex flex-col gap-3 pb-4";

  const searchContainerClass = layout === "horizontal" ? "flex-1" : "";

  const filtersContainerClass =
    layout === "horizontal" ? "flex-shrink-0" : "flex gap-3 items-center";

  return (
    <div className={`${containerClass} ${className}`}>
      <div className={searchContainerClass}>
        <SearchInput
          value={searchTerm}
          onChange={onSearch}
          placeholder={searchPlaceholder}
        />
      </div>

      {children && <div className={filtersContainerClass}>{children}</div>}
    </div>
  );
};
