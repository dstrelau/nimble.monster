import { ArrowDownUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SortSelectProps<T> {
  value: T;
  items: { label: string; value: T }[];
  onChange: (sort: T) => void;
}

export const SortSelect = <T extends string>({
  items,
  value: sortOption,
  onChange: onSortChange,
}: SortSelectProps<T>) => (
  <Select value={sortOption} onValueChange={onSortChange}>
    <SelectTrigger>
      <ArrowDownUp className="size-4" />
      <SelectValue placeholder="Sort" />
    </SelectTrigger>
    <SelectContent>
      {items.map((i) => (
        <SelectItem key={i.value} value={i.value}>
          {i.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
