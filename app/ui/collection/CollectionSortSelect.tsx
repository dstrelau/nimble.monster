"use client";

import type { CollectionSortOption } from "@/app/collections/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CollectionSortSelectProps {
  value: CollectionSortOption;
  onChange: (value: string) => void;
}

const sortOptions: { value: CollectionSortOption; label: string }[] = [
  { value: "name", label: "Name (A-Z)" },
  { value: "-name", label: "Name (Z-A)" },
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
];

export const CollectionSortSelect: React.FC<CollectionSortSelectProps> = ({
  value,
  onChange,
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
