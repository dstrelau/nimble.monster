"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Check,
  Map as MapIcon,
  Search,
  Swords,
  TriangleAlert,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CreatorCombobox } from "@/components/shared/CreatorCombobox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  GLOBAL_SEARCH_ENTITY_LABELS,
  GLOBAL_SEARCH_ENTITY_TYPES,
  type GlobalSearchEntityType,
  type GlobalSearchResponse,
  type GlobalSearchResult,
} from "@/lib/services/global-search/contract";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<GlobalSearchEntityType, LucideIcon> = {
  monster: ENTITY_TYPE_ICONS.monster,
  hazard: TriangleAlert,
  item: ENTITY_TYPE_ICONS.item,
  companion: ENTITY_TYPE_ICONS.companion,
  ancestry: ENTITY_TYPE_ICONS.ancestry,
  background: ENTITY_TYPE_ICONS.background,
  class: ENTITY_TYPE_ICONS.class,
  subclass: ENTITY_TYPE_ICONS.subclass,
  spellSchool: ENTITY_TYPE_ICONS.school,
  collection: ENTITY_TYPE_ICONS.collection,
  encounter: Swords,
  adventure: MapIcon,
  family: ENTITY_TYPE_ICONS.family,
  rule: BookOpen,
};

type SearchStatus = "idle" | "loading" | "ready" | "error";

export function GlobalSearchDialog() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<GlobalSearchEntityType[]>([]);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const requestId = useRef(0);

  const typeParameter = types.join(",");

  useEffect(() => {
    if (pathname.startsWith("/obr")) return;

    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [pathname]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      requestId.current += 1;
      setResults([]);
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    setStatus("loading");

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmedQuery });
        if (typeParameter) params.set("types", typeParameter);
        if (creatorId) params.set("creatorId", creatorId);
        const response = await fetch(`/_actions/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Global search failed");
        const data: GlobalSearchResponse = await response.json();
        if (requestId.current !== currentRequestId) return;
        setResults(data.results);
        setStatus("ready");
      } catch {
        if (
          controller.signal.aborted ||
          requestId.current !== currentRequestId
        ) {
          return;
        }
        setResults([]);
        setStatus("error");
      }
    }, 225);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [creatorId, query, typeParameter]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setResults([]);
      setStatus("idle");
    }
  }

  function toggleType(type: GlobalSearchEntityType) {
    setTypes((current) =>
      current.includes(type)
        ? current.filter((candidate) => candidate !== type)
        : [...current, type]
    );
  }

  function selectResult(result: GlobalSearchResult) {
    handleOpenChange(false);
    router.push(result.href);
  }

  if (pathname.startsWith("/obr")) return null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 px-2 md:px-3"
        aria-label="Global search"
        onClick={() => setOpen(true)}
      >
        <Search />
        <span className="hidden md:inline">Search</span>
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] lg:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <Command shouldFilter={false}>
          <DialogTitle className="sr-only">Global search</DialogTitle>
          <DialogDescription className="sr-only">
            Search public site content by name, type, or creator.
          </DialogDescription>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search monsters, rules, items..."
            autoFocus
          />
          <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Filter by type"
                >
                  Types{types.length > 0 ? ` (${types.length})` : ""}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-3">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Entity types</p>
                  {GLOBAL_SEARCH_ENTITY_TYPES.map((type) => (
                    <Label key={type} htmlFor={`global-search-${type}`}>
                      <Checkbox
                        id={`global-search-${type}`}
                        checked={types.includes(type)}
                        onCheckedChange={() => toggleType(type)}
                      />
                      {GLOBAL_SEARCH_ENTITY_LABELS[type]}
                    </Label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <CreatorCombobox
              kind="monsters"
              value={creatorId}
              onChange={setCreatorId}
            />
            {(types.length > 0 || creatorId) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setTypes([]);
                  setCreatorId(null);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
          <CommandList className="max-h-[min(60vh,32rem)]">
            {status === "loading" && (
              <output className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </output>
            )}
            {status === "error" && (
              <div
                className="py-6 text-center text-sm text-destructive"
                role="alert"
              >
                Search is temporarily unavailable.
              </div>
            )}
            {status === "idle" && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type to search the site.
              </div>
            )}
            {status === "ready" && results.length === 0 && (
              <CommandEmpty>No matching public content.</CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup heading="Results">
                {results.map((result) => {
                  const Icon = TYPE_ICONS[result.type];
                  return (
                    <CommandItem
                      key={`${result.type}:${result.id}`}
                      value={`${result.type}:${result.id}`}
                      onSelect={() => selectResult(result)}
                      className="items-start py-3"
                    >
                      <Icon className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {result.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {result.subtitle ??
                            GLOBAL_SEARCH_ENTITY_LABELS[result.type]}
                          {result.creator ? ` · ${result.creator.name}` : ""}
                        </span>
                      </span>
                      {result.matchedField === "name" && (
                        <Check
                          className={cn("size-4 opacity-30")}
                          aria-label="Name match"
                        />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
