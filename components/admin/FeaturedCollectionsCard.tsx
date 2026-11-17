"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { publicCollections } from "@/app/%5Factions/publicCollections/contract";
import { updateFeaturedCollection } from "@/app/%5Factions/updateFeaturedCollection/contract";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { call } from "@/lib/contract";
import type { FeaturedCollectionAdminRow } from "@/lib/services/collections/queries";
import { getCollectionUrl } from "@/lib/utils/url";

interface SearchResult {
  id: string;
  label: string;
  creator: string;
}

interface FeaturedCollectionsCardProps {
  collections: FeaturedCollectionAdminRow[];
}

export function FeaturedCollectionsCard({
  collections,
}: FeaturedCollectionsCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rawQuery, setRawQuery] = useState("");
  const [query] = useDebouncedValue(rawQuery, { wait: 250 });
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    call(
      publicCollections,
      { search: query.trim(), limit: 20 },
      { signal: controller.signal }
    )
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setResults(
          data.map((collection) => ({
            id: collection.id,
            label: collection.name,
            creator: collection.creator.displayName,
          }))
        );
      })
      .catch(() => {
        // Keep existing results; changing the search retries the read.
      });
    return () => controller.abort();
  }, [query]);

  const featuredIds = new Set(collections.map((collection) => collection.id));

  function save(collectionId: string, featured: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await call(updateFeaturedCollection, { collectionId, featured });
        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to save collection"
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          Collections
          <Badge variant="secondary">{collections.length}</Badge>
        </CardTitle>
        <Combobox
          groups={[
            {
              items: results.filter((result) => !featuredIds.has(result.id)),
            },
          ]}
          value={undefined}
          onSelect={(item) => save(item.id, true)}
          onSearch={setRawQuery}
          renderItem={({ label, creator }) => (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{label}</span>
              <span className="shrink-0 text-muted-foreground">{creator}</span>
            </span>
          )}
          placeholder="Add collection"
          searchPlaceholder="Search public collections..."
          emptyMessage={
            query.trim() ? "No collections found." : "Type to search."
          }
          ariaLabel="Add collection to Monstery Monday"
          className="w-72 shrink-0"
          align="end"
        />
      </CardHeader>
      <CardContent className="space-y-2">
        {collections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No collections are featured.
          </p>
        ) : (
          <ul className="divide-y">
            {collections.map((collection) => (
              <li
                key={collection.id}
                className="flex items-center justify-between gap-4 py-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {collection.sequence === null ? (
                    <Badge variant="outline">No week</Badge>
                  ) : (
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {collection.sequence}
                    </span>
                  )}
                  <Link
                    href={getCollectionUrl(collection)}
                    className="truncate hover:underline"
                  >
                    {collection.name}
                  </Link>
                  <span className="shrink-0 text-muted-foreground">
                    {collection.creator.displayName}
                  </span>
                  {collection.visibility !== "public" && (
                    <Badge variant="outline">Hidden: not public</Badge>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  onClick={() => save(collection.id, false)}
                  aria-label={`Remove ${collection.name} from Monstery Monday`}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
