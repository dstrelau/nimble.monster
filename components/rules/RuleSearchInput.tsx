"use client";

import { LoaderCircle, NotebookPen, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { CATEGORIES } from "@/lib/rules/categories";
import { ruleUrl, variantParentUrl } from "@/lib/rules/rule-index";
import type { RuleSearchResult } from "@/lib/rules/search";
import { cn } from "@/lib/utils";

interface RuleSearchInputProps {
  defaultValue?: string;
  className?: string;
}

interface RuleSearchResponse {
  results: RuleSearchResult[];
}

export function RuleSearchInput({
  defaultValue = "",
  className,
}: RuleSearchInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [includeHomebrew, setIncludeHomebrew] = useState(false);
  const [results, setResults] = useState<RuleSearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    defaultValue.trim() ? "loading" : "idle"
  );
  const [open, setOpen] = useState(Boolean(defaultValue.trim()));
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const q = value.trim();
    if (!q) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const searchParams = new URLSearchParams({ q });
        if (includeHomebrew) searchParams.set("includeHomebrew", "true");
        const response = await fetch(
          `/rules/search?${searchParams.toString()}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Rule search failed");
        const data: RuleSearchResponse = await response.json();
        setResults(data.results);
        setSelectedIndex(-1);
        setStatus("ready");
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setSelectedIndex(-1);
        setStatus("error");
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [includeHomebrew, value]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function handleChange(nextValue: string) {
    setValue(nextValue);
    setResults([]);
    setSelectedIndex(-1);
    setStatus(nextValue.trim() ? "loading" : "idle");
    setOpen(Boolean(nextValue.trim()));
  }

  function handleIncludeHomebrewChange(pressed: boolean) {
    setIncludeHomebrew(pressed);
    setResults([]);
    setSelectedIndex(-1);
    setStatus(value.trim() ? "loading" : "idle");
    setOpen(Boolean(value.trim()));
  }

  function resultHref(result: RuleSearchResult): string {
    if (result.href) return result.href;
    if (result.variantOf) {
      return variantParentUrl(result.variantOf, result.slug);
    }
    return `${ruleUrl(result.slug)}${result.anchor ? `#${result.anchor}` : ""}`;
  }

  function selectResult(result: RuleSearchResult) {
    setOpen(false);
    router.push(resultHref(result));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setSelectedIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setSelectedIndex((current) =>
        current <= 0 ? results.length - 1 : current - 1
      );
      return;
    }

    if (event.key === "Enter" && open && selectedIndex >= 0) {
      event.preventDefault();
      selectResult(results[selectedIndex]);
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative z-20 flex w-full flex-col gap-2 sm:flex-row",
        className
      )}
    >
      <div className="relative min-w-0 flex-1">
        {status === "loading" ? (
          <LoaderCircle
            aria-label="Searching"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        ) : (
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          type="search"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setOpen(Boolean(value.trim()))}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          className="bg-muted/50 pl-9"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="rule-search-results"
          aria-expanded={open && results.length > 0}
          aria-activedescendant={
            open && selectedIndex >= 0
              ? resultRefs.current[selectedIndex]?.id
              : undefined
          }
        />
        {open && results.length > 0 && (
          <Command
            shouldFilter={false}
            value={
              selectedIndex >= 0
                ? `${results[selectedIndex].slug}-${results[selectedIndex].anchor ?? ""}`
                : "rule-search-no-selection"
            }
            onValueChange={(selectedValue) => {
              const index = results.findIndex(
                (result) =>
                  `${result.slug}-${result.anchor ?? ""}` === selectedValue
              );
              setSelectedIndex(index);
            }}
            className="absolute top-full mt-2 h-auto w-full border shadow-lg"
          >
            <CommandList id="rule-search-results" className="max-h-96">
              <CommandGroup heading="Rules">
                {results.map((result, index) => {
                  const category = CATEGORIES.find(
                    (candidate) => candidate.slug === result.category
                  );
                  return (
                    <CommandItem
                      key={`${result.slug}#${result.anchor ?? ""}`}
                      ref={(element) => {
                        resultRefs.current[index] = element;
                      }}
                      value={`${result.slug}-${result.anchor ?? ""}`}
                      onSelect={() => selectResult(result)}
                      className="items-start py-3"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        {result.customRule && (
                          <NotebookPen
                            aria-label="Homebrew"
                            className="mt-0.5 size-4 shrink-0 stroke-flame"
                          />
                        )}
                        <span className="min-w-0 flex-1 font-medium">
                          {result.title}
                        </span>
                        {!result.customRule && (
                          <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-2">
                            {result.group === "gm-guidance" && (
                              <Badge variant="outline">GM Guidance</Badge>
                            )}
                            {result.faqKind && (
                              <Badge variant="secondary">
                                {result.faqKind === "official"
                                  ? "FAQ · Official"
                                  : "Common Question"}
                              </Badge>
                            )}
                            {result.variantOf && (
                              <Badge variant="secondary">
                                Official variant
                              </Badge>
                            )}
                            {category && (
                              <Badge variant="secondary">
                                {category.label}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </div>
      <Toggle
        variant="outline"
        pressed={includeHomebrew}
        onPressedChange={handleIncludeHomebrewChange}
        className="self-start sm:self-auto"
      >
        <NotebookPen className="stroke-flame" />
        Include Homebrew
      </Toggle>
    </div>
  );
}
