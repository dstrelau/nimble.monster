"use client";

import { Search, X } from "lucide-react";
import { useRef, useEffect } from "react";
import { IconInput } from "@/components/app/IconInput";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Only update input value if it differs significantly (avoid interrupting typing)
  useEffect(() => {
    if (inputRef.current && inputRef.current !== document.activeElement) {
      inputRef.current.value = value;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    onChange("");
  };

  return (
    <div className="relative">
      <IconInput
        ref={inputRef}
        type="text"
        icon={Search}
        placeholder={placeholder}
        defaultValue={value}
        onChange={handleChange}
        autoComplete="off"
        spellCheck={false}
        className="pr-9"
      />
      {value && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  );
};
