"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchInput } from "@/app/ui/SearchInput";
import { getPaperforgeImageUrl } from "@/components/PaperforgeImage";
import type { PaperForgeEntry } from "@/lib/paperforge-catalog";

interface PaperforgeCatalogProps {
  entries: PaperForgeEntry[];
}

export function PaperforgeCatalog({ entries }: PaperforgeCatalogProps) {
  const [filter, setFilter] = useState("");

  const filteredEntries = entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(filter.toLowerCase()) ||
      entry.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <SearchInput
        value={filter}
        onChange={setFilter}
        placeholder="Filter by name or ID..."
        className="max-w-sm"
      />

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filteredEntries.map((entry) => (
          <Link
            key={entry.id}
            href={entry.postUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border bg-card p-3 space-y-2 text-center transition-colors hover:bg-accent hover:border-accent-foreground/20"
          >
            <div className="relative aspect-square rounded overflow-hidden">
              {/* biome-ignore lint/performance/noImgElement: Using pre-sized Tigris images */}
              <img
                src={getPaperforgeImageUrl(entry.folder, 200)}
                alt={entry.name}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <p className="font-medium text-sm truncate" title={entry.name}>
                {entry.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {entry.id}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No entries match "{filter}"
        </p>
      )}
    </>
  );
}
