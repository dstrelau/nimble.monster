"use client";

import type { LucideIcon } from "lucide-react";
import { BookOpen, Map as MapIcon, Swords, TriangleAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
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
import {
  GLOBAL_SEARCH_ENTITY_LABELS,
  type GlobalSearchEntityType,
  type GlobalSearchResponse,
  type GlobalSearchResult,
} from "@/lib/services/global-search/contract";
import {
  ENTITY_TYPE_ICONS,
  SITE_NAVIGATION_GROUPS,
} from "@/lib/types/entity-links";

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
  }, [query]);

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
          Search public site content.
        </DialogDescription>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search"
          autoFocus
        />
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
            <div className="grid grid-cols-2 gap-x-2">
              {SITE_NAVIGATION_GROUPS.map((group) => (
                <CommandGroup key={group.id} heading={group.label}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.key}
                        value={`browse:${item.key}`}
                        className="group hover:bg-accent hover:text-accent-foreground"
                        onSelect={() => {
                          handleOpenChange(false);
                          router.push(`/${item.key}`);
                        }}
                      >
                        <Icon className="text-muted-foreground group-hover:text-primary group-data-[selected=true]:text-primary" />
                        {item.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
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
                    className="group items-start py-3 hover:bg-accent hover:text-accent-foreground"
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
                        className="size-10 shrink-0 fill-muted-foreground group-hover:fill-primary group-data-[selected=true]:fill-primary"
                      />
                    ) : (
                      <Icon className="mt-0.5 text-muted-foreground group-hover:text-primary group-data-[selected=true]:text-primary" />
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
