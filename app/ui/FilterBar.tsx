"use client";

import type React from "react";
import { SearchInput } from "@/app/ui/SearchInput";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  searchTerm: string | null;
  onSearch: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearch,
  children,
  className = "",
}) => {

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row", className)}>
      <div className="flex-1">
        <SearchInput
          value={searchTerm || ""}
          onChange={onSearch}
          placeholder={"Search"}
        />
      </div>

      {children && <div className="flex flex-shrink-0 gap-4">{children}</div>}
    </div>
  );
};
