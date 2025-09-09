import { ArrowDownWideNarrow } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption =
  | "name-asc"
  | "name-desc"
  | "level-asc"
  | "level-desc"
  | "hp-asc"
  | "hp-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Name (A→Z)" },
  { value: "name-desc", label: "Name (Z→A)" },
  { value: "level-asc", label: "Level (Low→High)" },
  { value: "level-desc", label: "Level (High→Low)" },
  { value: "hp-asc", label: "HP (Low→High)" },
  { value: "hp-desc", label: "HP (High→Low)" },
];

export interface SortSelectProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

export const SortSelect = ({
  value: sortOption,
  onChange: onSortChange,
}: SortSelectProps) => (
  <Select value={sortOption} onValueChange={onSortChange}>
    <SelectTrigger>
      <ArrowDownWideNarrow className="h-4 w-4" />
      <SelectValue placeholder="Sort" />
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
