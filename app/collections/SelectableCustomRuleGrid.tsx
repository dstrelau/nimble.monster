"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { publicCustomRules } from "@/app/%5Factions/publicCustomRules/contract";
import { CustomRuleMiniCard } from "@/components/custom-rule/CustomRuleMiniCard";
import { FilterBar } from "@/components/shared/FilterBar";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/GridStates";
import { call } from "@/lib/contract";
import type { CustomRuleMini } from "@/lib/db/custom-rule";

const publicCustomRulesQueryOptions = () =>
  queryOptions({
    queryKey: ["custom-rules", "public"],
    queryFn: async ({ signal }) =>
      (await call(publicCustomRules, undefined, { signal })).data,
  });

interface SelectableCustomRuleGridProps {
  selectedIds: Set<string>;
  onToggle: (customRule: CustomRuleMini) => void;
}

export function SelectableCustomRuleGrid({
  selectedIds,
  onToggle,
}: SelectableCustomRuleGridProps) {
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery(publicCustomRulesQueryOptions());

  const filtered = useMemo(() => {
    const search = searchTerm?.toLowerCase();
    return (data ?? []).filter(
      (rule) => !search || rule.name.toLowerCase().includes(search)
    );
  }, [data, searchTerm]);

  return (
    <div className="space-y-6">
      <FilterBar
        searchTerm={searchTerm}
        onSearch={(v) => setSearchTerm(v || null)}
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : filtered.length === 0 ? (
        <EmptyState entityName="custom rules" />
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 items-start">
          {filtered.map((rule) => (
            <CustomRuleMiniCard
              key={rule.id}
              customRule={rule}
              selectable
              selected={selectedIds.has(rule.id)}
              onSelect={() => onToggle(rule)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
