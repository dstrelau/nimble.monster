// from https://github.com/shadcn-ui/ui/issues/948
"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type Option = {
  value: string;
  label: string;
};

export type OptionGroup = {
  label: string;
  options: Option[];
};

interface MultiSelectProps {
  options?: Option[];
  groups?: OptionGroup[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  popoverClassName?: string;
  itemClassName?: string;
  showSearch?: boolean;
  icon?: React.ReactNode;
  displayValue?: string;
}

export function MultiSelect({
  options,
  groups,
  selected,
  onChange,
  placeholder = "Select options...",
  emptyText = "No options found.",
  className,
  popoverClassName,
  itemClassName,
  showSearch = true,
  icon,
  displayValue,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const allOptions = React.useMemo(
    () => groups?.flatMap((g) => g.options) ?? options ?? [],
    [groups, options]
  );

  const handleSelect = React.useCallback(
    (value: string) => {
      const updatedSelected = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      onChange(updatedSelected);
    },
    [selected, onChange]
  );

  const selectedLabels = React.useMemo(
    () =>
      selected
        .sort((a, b) => {
          const aIndex = allOptions.findIndex((opt) => opt.value === a);
          const bIndex = allOptions.findIndex((opt) => opt.value === b);
          return aIndex - bIndex;
        })
        .map(
          (value) => allOptions.find((option) => option.value === value)?.label
        )
        .filter(Boolean)
        .join(", "),
    [selected, allOptions]
  );

  const renderItem = (option: Option) => (
    <CommandItem
      key={option.value}
      value={option.label}
      onSelect={() => handleSelect(option.value)}
      className={itemClassName}
    >
      {option.label}
      <Check
        className={cn(
          "ml-auto h-4 w-4",
          selected.includes(option.value) ? "opacity-100" : "opacity-0"
        )}
      />
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {icon}
          <span className={cn("truncate", itemClassName)}>
            {displayValue ??
              (selected.length > 0 ? selectedLabels : placeholder)}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-full p-0", popoverClassName)}
      >
        <Command>
          {showSearch && (
            <CommandInput placeholder="Search..." className="h-9" />
          )}
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {groups
              ? groups.map((group) => (
                  <CommandGroup key={group.label} heading={group.label}>
                    {group.options.map(renderItem)}
                  </CommandGroup>
                ))
              : (options ?? []).length > 0 && (
                  <CommandGroup>{(options ?? []).map(renderItem)}</CommandGroup>
                )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
