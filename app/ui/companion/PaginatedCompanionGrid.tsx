"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type React from "react";
import { publicCompanionsInfiniteQueryOptions } from "@/app/companions/hooks";
import { Button } from "@/components/ui/button";
import type { CompanionClassOption } from "@/lib/services/companions/types";
import { PaginateCompanionsSortOptions } from "@/lib/services/companions/types";
import { SUBCLASS_CLASSES } from "@/lib/types";
import { Card } from "./Card";
import { SimpleFilterBar } from "./SimpleFilterBar";

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
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const filteredCompanions = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <SimpleFilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
        classFilter={validatedClass}
        onClassFilterChange={handleClassChange}
      />

      {!filteredCompanions || filteredCompanions?.length === 0 ? (
        <div className="col-span-4 text-center text-muted-foreground">
          No companions found.
        </div>
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
        <div className="flex justify-center">
          <Button
            className="min-w-2xs"
            onClick={() => fetchNextPage()}
            disabled={isFetching}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};
