"use client";

import type React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSourcesForEntityTypeQuery,
  useSourcesQuery,
} from "@/lib/services/sources";
import type { EntityType } from "@/lib/services/sources/types";

interface SourceFilterProps {
  source: string | null;
  onSourceChange: (source: string | null) => void;
  entityType?: EntityType;
}

export const SourceFilter: React.FC<SourceFilterProps> = ({
  source,
  onSourceChange,
  entityType,
}) => {
  const allQuery = useSourcesQuery({ enabled: !entityType });
  const entityQuery = useSourcesForEntityTypeQuery(entityType ?? "monsters", {
    enabled: !!entityType,
  });
  const sources = (entityType ? entityQuery.data : allQuery.data) ?? [];

  return (
    <Select
      value={source || "all"}
      onValueChange={(v) => onSourceChange(v === "all" ? null : v)}
    >
      <SelectTrigger className="min-w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Sources</SelectItem>
        {sources.map((s) => (
          <SelectItem key={s.id} value={s.abbreviation}>
            {s.abbreviation}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
