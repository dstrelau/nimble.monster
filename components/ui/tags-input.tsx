"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn, randomUUID } from "@/lib/utils";

interface TagEntry {
  id: string;
  value: string;
}

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

function toTagEntries(values: string[]): TagEntry[] {
  return values.map((v) => ({ id: randomUUID(), value: v }));
}

export function TagsInput({
  value,
  onChange,
  placeholder,
  className,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState<TagEntry[]>(() => toTagEntries(value));
  const internalValueRef = useRef<string[]>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal tags when the value prop changes externally (e.g. form.reset())
  useEffect(() => {
    const prev = JSON.stringify(internalValueRef.current);
    const next = JSON.stringify(value);
    if (prev !== next) {
      internalValueRef.current = value;
      setTags(toTagEntries(value));
    }
  }, [value]);

  const emitChange = (next: TagEntry[]) => {
    const values = next.map((t) => t.value);
    internalValueRef.current = values;
    setTags(next);
    onChange(values);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed) {
      emitChange([...tags, { id: randomUUID(), value: trimmed }]);
    }
    setInputValue("");
  };

  const removeTag = (id: string) => {
    emitChange(tags.filter((t) => t.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1].id);
    } else if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.endsWith(",")) {
      addTag(val.slice(0, -1));
    } else {
      setInputValue(val);
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: clicking the container focuses the inner input
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard interaction is fully handled by the inner input element
    <div
      className={cn(
        "flex flex-wrap gap-1.5 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm min-h-9 cursor-text",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-md border border-transparent bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium"
        >
          {tag.value}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag.id);
            }}
            className="rounded-full hover:bg-muted -mr-0.5"
            aria-label={`Remove ${tag.value}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputValue)}
        placeholder={tags.length === 0 ? placeholder : undefined}
        className="flex-1 min-w-24 bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
