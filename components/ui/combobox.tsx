"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ComboboxItem {
  id: string;
  label: string;
}

interface ComboboxGroup<T extends ComboboxItem> {
  heading?: string;
  items: T[];
}

interface ComboboxProps<T extends ComboboxItem> {
  groups: ComboboxGroup<T>[];
  value: string | undefined;
  onSelect: (item: T) => void;
  onSearch?: (search: string) => void;
  onOpenChange?: (open: boolean) => void;
  renderItem?: (item: T) => ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
}

function Combobox<T extends ComboboxItem>({
  groups,
  value,
  onSelect,
  onSearch,
  onOpenChange,
  renderItem,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  loading = false,
  className,
  align = "start",
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [onOpenChange]
  );

  const selectedItem = groups
    .flatMap((g) => g.items)
    .find((item) => item.id === value);

  const nonEmptyGroups = groups.filter((g) => g.items.length > 0);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-48 justify-between",
            !selectedItem && "text-muted-foreground",
            className
          )}
        >
          {selectedItem
            ? (renderItem?.(selectedItem) ?? selectedItem.label)
            : placeholder}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align={align}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={onSearch}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                {nonEmptyGroups.map((group, groupIndex) => (
                  <span key={group.heading ?? groupIndex}>
                    {groupIndex > 0 && <CommandSeparator />}
                    <CommandGroup heading={group.heading}>
                      {group.items.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.id}
                          onSelect={() => {
                            onSelect(item);
                            setOpen(false);
                          }}
                        >
                          {renderItem ? renderItem(item) : item.label}
                          <Check
                            className={cn(
                              "self-center ml-1 size-4",
                              value === item.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </span>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { Combobox };
export type { ComboboxItem, ComboboxGroup, ComboboxProps };
