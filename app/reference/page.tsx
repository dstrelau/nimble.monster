import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ReferenceCategoryIcon } from "@/app/ui/reference/ReferenceCategoryIcon";
import { ReferenceSearchInput } from "@/app/ui/reference/ReferenceSearchInput";
import { searchReference } from "@/lib/db/reference";
import { CATEGORIES } from "@/lib/reference/categories";
import { getAllReferenceFrontmatter } from "@/lib/reference/filesystem";
import { SITE_NAME } from "@/lib/utils/branding";

export const metadata: Metadata = {
  title: `Rules Reference - ${SITE_NAME}`,
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ReferencePage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim();

  if (query) {
    const results = await searchReference(query);

    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/reference"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Rules Reference
          </Link>
        </div>
        <div className="mb-6">
          <ReferenceSearchInput defaultValue={query} />
        </div>
        <h1 className="mb-4 text-2xl font-bold">
          Search results for &ldquo;{query}&rdquo;
        </h1>
        {results.length === 0 ? (
          <p className="text-muted-foreground">No results found.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {results.map((result) => {
              const category = CATEGORIES.find(
                (c) => c.slug === result.category
              );
              return (
                <li key={result.slug}>
                  <Link
                    href={`/reference/${result.slug}`}
                    className="block px-4 py-4 hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.title}</span>
                      {category && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {category.label}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm text-muted-foreground [&_mark]:bg-yellow-200 [&_mark]:text-foreground dark:[&_mark]:bg-yellow-800"
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: FTS5 snippet output is safe (mark tags only)
                      dangerouslySetInnerHTML={{ __html: result.excerpt }}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  const allEntries = getAllReferenceFrontmatter();
  const entriesByCategory = new Map<
    string,
    Array<{ slug: string; title: string }>
  >();
  for (const entry of allEntries) {
    const list = entriesByCategory.get(entry.category) ?? [];
    list.push({ slug: entry.slug, title: entry.title });
    entriesByCategory.set(entry.category, list);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rules Reference</h1>
          <p className="mt-1 text-muted-foreground">
            Browse rules by category or search across all entries
          </p>
        </div>
        <ReferenceSearchInput />
      </div>
      <div className="space-y-8">
        {CATEGORIES.map((category) => {
          const entries = entriesByCategory.get(category.slug);
          if (!entries?.length) return null;
          return (
            <section key={category.slug}>
              <div className="flex items-center gap-2 mb-3">
                <ReferenceCategoryIcon
                  icon={category.icon}
                  className="size-5 text-primary"
                />
                <h2 className="text-xl font-semibold">{category.label}</h2>
              </div>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {entries.map((entry) => (
                  <li key={entry.slug}>
                    <Link
                      href={`/reference/${entry.slug}`}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <span>{entry.title}</span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
