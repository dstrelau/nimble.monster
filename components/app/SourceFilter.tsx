"use client";

import type React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSourcesQuery } from "@/lib/services/sources";

interface SourceFilterProps {
  sourceId: string | null;
  onSourceChange: (sourceId: string | null) => void;
}

export const SourceFilter: React.FC<SourceFilterProps> = ({
  sourceId,
  onSourceChange,
}) => {
  const { data: sources = [] } = useSourcesQuery();

  return (
    <Select
      value={sourceId || "all"}
      onValueChange={(v) => onSourceChange(v === "all" ? null : v)}
    >
      <SelectTrigger className="min-w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Sources</SelectItem>
        {sources.map((source) => (
          <SelectItem key={source.id} value={source.id}>
            {source.abbreviation}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
