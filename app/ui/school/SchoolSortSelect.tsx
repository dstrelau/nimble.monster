"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SpellSchoolSortOption } from "@/lib/types";

interface SchoolSortSelectProps {
  value: SpellSchoolSortOption;
  onChange: (value: SpellSchoolSortOption) => void;
}

const SORT_OPTIONS: { value: SpellSchoolSortOption; label: string }[] = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "created-desc", label: "Newest First" },
  { value: "created-asc", label: "Oldest First" },
];

export const SchoolSortSelect: React.FC<SchoolSortSelectProps> = ({
  value,
  onChange,
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
