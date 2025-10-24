"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type React from "react";
import { publicCompanionsInfiniteQueryOptions } from "@/app/companions/hooks";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { LoadMoreButton } from "@/app/ui/shared/LoadMoreButton";
import type { CompanionClassOption } from "@/lib/services/companions/types";
import { PaginateCompanionsSortOptions } from "@/lib/services/companions/types";
import { SUBCLASS_CLASSES } from "@/lib/types";
import { Card } from "./Card";
import { CompanionFilterBar } from "./CompanionFilterBar";

const isValidCompanionClass = (
  value: string
): value is CompanionClassOption => {
  return value === "all" || SUBCLASS_CLASSES.some((c) => c.value === value);
};

export const PaginatedCompanionGrid: React.FC = () => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });

  const [sortQuery, setSortQuery] = useQueryState(
    "sort",
    parseAsStringLiteral(PaginateCompanionsSortOptions).withDefault(
      "-createdAt"
    )
  );
  const [classQuery, setClassQuery] = useQueryState(
    "class",
    parseAsString.withDefault("all")
  );

  const handleClassChange = (value: CompanionClassOption) => {
    setClassQuery(value);
  };

  const validatedClass: CompanionClassOption = isValidCompanionClass(classQuery)
    ? classQuery
    : "all";

  const params = {
    search: searchQuery ?? undefined,
    sort: sortQuery,
    class: validatedClass,
  };

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(publicCompanionsInfiniteQueryOptions(params));

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  const filteredCompanions = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <CompanionFilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
        classFilter={validatedClass}
        onClassFilterChange={handleClassChange}
      />

      {!filteredCompanions || filteredCompanions?.length === 0 ? (
        <EmptyState entityName="companions" />
      ) : (
        <div className="max-w-3xl mx-auto grid grid-cols-1 gap-4">
          {filteredCompanions.map((companion) => (
            <div key={companion.id} className="w-full">
              <Card
                companion={companion}
                creator={companion.creator}
                hideDescription
              />
            </div>
          ))}
        </div>
      )}
      {data?.pages.at(-1)?.data.length === 6 && hasNextPage && (
        <LoadMoreButton onClick={() => fetchNextPage()} disabled={isFetching} />
      )}
    </div>
  );
};
