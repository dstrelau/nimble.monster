"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  searchTerm: string | null;
  sortOption: string;
  onSearch: (search: string | null) => void;
  onSortChange: (sort: "name" | "createdAt" | "-name" | "-createdAt") => void;
}

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
  { value: "name", label: "Name (A-Z)" },
  { value: "-name", label: "Name (Z-A)" },
];

export const FilterBar = ({
  searchTerm,
  sortOption,
  onSearch,
  onSortChange,
}: FilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-grow">
        <Input
          type="text"
          placeholder="Search backgrounds..."
          value={searchTerm ?? ""}
          onChange={(e) => onSearch(e.target.value || null)}
          className="w-full"
        />
      </div>
      <div className="w-full sm:w-48">
        <Select value={sortOption} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
