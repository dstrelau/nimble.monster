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
    <div className={cn("flex flex-wrap gap-4", className)}>
      <SearchInput
        value={searchTerm || ""}
        onChange={onSearch}
        placeholder={"Search"}
        className="flex-1 basis-48"
      />
      {children}
    </div>
  );
};
