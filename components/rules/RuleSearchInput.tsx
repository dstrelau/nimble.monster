"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
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
  const [results, setResults] = useState<RuleSearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    defaultValue.trim() ? "loading" : "idle"
  );
  const [open, setOpen] = useState(Boolean(defaultValue.trim()));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (!q) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/rules/search?q=${encodeURIComponent(q)}`
        );
        if (!response.ok) throw new Error("Rule search failed");
        const data: RuleSearchResponse = await response.json();
        if (!cancelled) {
          setResults(data.results);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setStatus("error");
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

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
    setStatus(nextValue.trim() ? "loading" : "idle");
    setOpen(Boolean(nextValue.trim()));
  }

  function resultHref(result: RuleSearchResult): string {
    if (result.variantOf) {
      return variantParentUrl(result.variantOf, result.slug);
    }
    return `${ruleUrl(result.slug)}${result.anchor ? `#${result.anchor}` : ""}`;
  }

  function selectResult(result: RuleSearchResult) {
    setOpen(false);
    router.push(resultHref(result));
  }

  return (
    <div ref={containerRef} className={cn("relative z-20 w-full", className)}>
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
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder="Search"
        className="bg-muted/50 pl-9"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="rule-search-results"
        aria-expanded={open && results.length > 0}
      />
      {open && results.length > 0 && (
        <Command
          shouldFilter={false}
          className="absolute top-full mt-2 h-auto w-full border shadow-lg"
        >
          <CommandList id="rule-search-results" className="max-h-96">
            <CommandGroup heading="Rules">
              {results.map((result) => {
                const category = CATEGORIES.find(
                  (candidate) => candidate.slug === result.category
                );
                return (
                  <CommandItem
                    key={`${result.slug}#${result.anchor ?? ""}`}
                    value={`${result.slug}-${result.anchor ?? ""}`}
                    onSelect={() => selectResult(result)}
                    className="items-start py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-medium">{result.title}</span>
                        {result.variantOf && (
                          <Badge variant="secondary">Official variant</Badge>
                        )}
                        {category && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {category.label}
                          </span>
                        )}
                      </div>
                      <p
                        className="line-clamp-2 text-xs text-muted-foreground [&_mark]:bg-yellow-200 [&_mark]:text-foreground dark:[&_mark]:bg-yellow-800"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: buildExcerpt escapes the text and emits only <mark>
                        dangerouslySetInnerHTML={{ __html: result.excerpt }}
                      />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      )}
    </div>
  );
}
