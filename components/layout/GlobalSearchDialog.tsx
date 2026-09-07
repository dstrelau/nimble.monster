"use client";

import type { LucideIcon } from "lucide-react";
import { BookOpen, Map as MapIcon, Swords, TriangleAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { GameIcon } from "@/components/icons/GameIcon";
import { PaperforgeImage } from "@/components/paperforge/PaperforgeImage";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  GLOBAL_SEARCH_ENTITY_LABELS,
  type GlobalSearchEntityType,
  type GlobalSearchResponse,
  type GlobalSearchResult,
} from "@/lib/services/global-search/contract";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";

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
type SearchScope = "all" | "mine";

export function GlobalSearchDialog() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const requestId = useRef(0);

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
        if (scope === "mine") params.set("scope", "mine");
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
  }, [query, scope]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setResults([]);
      setStatus("idle");
    }
  }

  function selectResult(result: GlobalSearchResult) {
    handleOpenChange(false);
    router.push(result.href);
  }

  if (pathname.startsWith("/obr")) return null;

  const groupedResults = results.reduce<
    { type: GlobalSearchEntityType; results: GlobalSearchResult[] }[]
  >((groups, result) => {
    const group = groups.find((candidate) => candidate.type === result.type);
    if (group) group.results.push(result);
    else groups.push({ type: result.type, results: [result] });
    return groups;
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <Command
        shouldFilter={false}
        className="h-[min(70vh,36rem)] rounded-none"
      >
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <DialogDescription className="sr-only">
          Search public site content or your library.
        </DialogDescription>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search monsters, rules, items..."
          autoFocus
        />
        <div className="border-b px-3 py-2">
          <ToggleGroup
            type="single"
            value={scope}
            onValueChange={(value: SearchScope) => {
              if (value) setScope(value);
            }}
            variant="outline"
            size="sm"
            className="justify-start"
            aria-label="Search scope"
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="mine" disabled={!session?.user?.id}>
              My Library
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <CommandList className="max-h-none flex-1 pb-2">
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
          {groupedResults.map((group) => (
            <CommandGroup
              key={group.type}
              heading={GLOBAL_SEARCH_ENTITY_LABELS[group.type]}
            >
              {group.results.map((result) => {
                const Icon = TYPE_ICONS[result.type];
                return (
                  <CommandItem
                    key={`${result.type}:${result.id}`}
                    value={`${result.type}:${result.id}`}
                    onSelect={() => selectResult(result)}
                    className="items-start py-3"
                  >
                    {result.paperforgeId ? (
                      <PaperforgeImage
                        id={result.paperforgeId}
                        size={50}
                        className="size-12 shrink-0 rounded-sm object-contain"
                      />
                    ) : result.imageIcon ? (
                      <GameIcon
                        iconId={result.imageIcon}
                        className="size-10 shrink-0 fill-icon/50"
                      />
                    ) : (
                      <Icon className="mt-0.5" />
                    )}
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
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
