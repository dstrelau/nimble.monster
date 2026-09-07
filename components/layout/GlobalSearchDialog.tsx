"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BookOpen,
  Map as MapIcon,
  Swords,
  TriangleAlert,
} from "lucide-react";
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
  type SiteNavigationItemKey,
} from "@/lib/types/entity-links";
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

const NAVIGATION_SEARCH_TYPES = {
  monsters: "monster",
  hazards: "hazard",
  companions: "companion",
  ancestries: "ancestry",
  backgrounds: "background",
  classes: "class",
  subclasses: "subclass",
  "spell-schools": "spellSchool",
  items: "item",
  adventures: "adventure",
  encounters: "encounter",
  rules: "rule",
} satisfies Record<SiteNavigationItemKey, GlobalSearchEntityType>;

type SearchStatus = "idle" | "loading" | "ready" | "error";

export function GlobalSearchDialog() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] =
    useState<GlobalSearchEntityType | null>(null);
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
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
    if (!trimmedQuery && !selectedType) {
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
        const params = new URLSearchParams({ limit: "12" });
        if (trimmedQuery) params.set("q", trimmedQuery);
        if (selectedType) params.set("type", selectedType);
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
  }, [query, selectedType]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setSelectedType(null);
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
  const displayedGroups = selectedType
    ? [{ type: selectedType, results }]
    : groupedResults;
  const SelectedTypeIcon = selectedType ? TYPE_ICONS[selectedType] : null;
  const selectedTypeLabel =
    selectedType === "spellSchool"
      ? "Spells"
      : selectedType
        ? GLOBAL_SEARCH_ENTITY_LABELS[selectedType]
        : null;

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <Command
        shouldFilter={false}
        className={cn(
          "h-[min(70vh,36rem)] rounded-none",
          selectedType && "[&_[cmdk-input-wrapper]>svg]:invisible"
        )}
      >
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <DialogDescription className="sr-only">
          Search public site content.
        </DialogDescription>
        <div className="relative">
          {selectedType && SelectedTypeIcon && (
            <button
              type="button"
              className="group/type absolute top-3.5 left-3 z-10 size-5 text-muted-foreground hover:text-primary"
              aria-label={`Clear ${selectedTypeLabel} filter`}
              title={`Clear ${selectedTypeLabel} filter`}
              onClick={() => {
                setSelectedType(null);
                inputRef.current?.focus();
              }}
            >
              <SelectedTypeIcon className="size-5 group-hover/type:hidden group-focus/type:hidden" />
              <ArrowLeft className="hidden size-5 group-hover/type:block group-focus/type:block" />
            </button>
          )}
          <CommandInput
            ref={inputRef}
            value={query}
            onValueChange={setQuery}
            placeholder={
              selectedType ? `Search ${selectedTypeLabel}` : "Search"
            }
            autoFocus
          />
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
          {status === "idle" && !selectedType && (
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
                          setQuery("");
                          setResults([]);
                          setSelectedType(NAVIGATION_SEARCH_TYPES[item.key]);
                        }}
                      >
                        <Icon className="text-muted-foreground group-hover:text-primary group-data-[selected=true]:text-primary" />
                        {item.label}
                      </CommandItem>
                    );
                  })}
                  {group.id === "play" && (
                    <CommandItem
                      value="browse:collections"
                      className="group hover:bg-accent hover:text-accent-foreground"
                      onSelect={() => {
                        setQuery("");
                        setResults([]);
                        setSelectedType("collection");
                      }}
                    >
                      <ENTITY_TYPE_ICONS.collection className="text-muted-foreground group-hover:text-primary group-data-[selected=true]:text-primary" />
                      Collections
                    </CommandItem>
                  )}
                </CommandGroup>
              ))}
            </div>
          )}
          {status === "ready" && results.length === 0 && (
            <CommandEmpty>No matching public content.</CommandEmpty>
          )}
          {displayedGroups.map((group) => (
            <CommandGroup
              key={group.type}
              heading={GLOBAL_SEARCH_ENTITY_LABELS[group.type]}
            >
              {group.results.map((result) => {
                const Icon = TYPE_ICONS[result.type];
                const metadata = result.subtitle
                  ? result.creator
                    ? `${result.subtitle} · ${result.creator.name}`
                    : result.subtitle
                  : result.creator?.name;
                return (
                  <CommandItem
                    key={`${result.type}:${result.id}`}
                    value={`${result.type}:${result.id}`}
                    onSelect={() => selectResult(result)}
                    className="group items-center !py-2 hover:bg-accent hover:text-accent-foreground"
                  >
                    {result.paperforgeId ? (
                      <PaperforgeImage
                        id={result.paperforgeId}
                        size={40}
                        className="size-9 shrink-0 rounded-sm object-contain"
                      />
                    ) : result.imageIcon ? (
                      <span className="flex size-9 shrink-0 items-center justify-center">
                        <GameIcon
                          iconId={result.imageIcon}
                          className="!size-8 fill-muted-foreground group-hover:fill-primary group-data-[selected=true]:fill-primary"
                        />
                      </span>
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center">
                        <Icon className="text-muted-foreground group-hover:text-primary group-data-[selected=true]:text-primary" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {result.name}
                      </span>
                      {metadata && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {metadata}
                        </span>
                      )}
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
