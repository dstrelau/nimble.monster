"use client";

import { CircleSlash2, Shuffle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ColorPicker } from "@/app/items/ColorPicker";
import { ICONS } from "@/components/game-icons";
import { GameIcon } from "@/components/icons/GameIcon";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  selectedIcon?: string;
  selectedColor?: string;
  onIconSelect: (iconId: string | null) => void;
  onColorSelect?: (color: string | null) => void;
  showColorPicker?: boolean;
}

export function IconPicker({
  selectedIcon,
  selectedColor,
  onIconSelect,
  onColorSelect,
  showColorPicker = false,
}: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const icons = useMemo(() => {
    return ICONS.map((icon) => ({
      ...icon,
      searchName: icon.id.replace(/-/g, "").toLowerCase(),
    }));
  }, []);

  // Start with a deterministic slice so SSR and the first client render
  // match, then shuffle client-side only (avoids a hydration mismatch).
  const [randomIcons, setRandomIcons] = useState(() => icons.slice(0, 24));

  useEffect(() => {
    const pool = [...icons];
    const sample = [];
    for (let i = 0; i < 24 && pool.length > 0; i++) {
      const index = Math.floor(Math.random() * pool.length);
      sample.push(pool[index]);
      pool[index] = pool[pool.length - 1];
      pool.pop();
    }
    setRandomIcons(sample);
  }, [icons]);

  const filteredIcons = useMemo(() => {
    if (!searchTerm || searchTerm.length < 3) {
      return randomIcons;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const compactSearch = lowercaseSearch.replace(/\s+/g, "");
    return icons.filter(
      (icon) =>
        icon.searchName.includes(compactSearch) ||
        icon.name.toLowerCase().includes(lowercaseSearch)
    );
  }, [icons, searchTerm, randomIcons]);

  const handleIconClick = (iconId: string) => {
    onIconSelect(iconId === selectedIcon ? null : iconId);
  };

  const handleRandomize = () => {
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    onIconSelect(randomIcon.id);
  };

  return (
    <div className="space-y-3 rounded-lg border-2 border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRandomize}
          >
            <Shuffle className="size-4" />
            Randomize
          </Button>
          {selectedIcon && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onIconSelect(null)}
            >
              <CircleSlash2 className="size-4" />
              Clear
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-56"
          />
          <a
            href="https://game-icons.net"
            target="_blank"
            rel="noreferrer"
            className="hidden text-xs whitespace-nowrap text-muted-foreground sm:inline"
          >
            game-icons.net
          </a>
        </div>
      </div>

      <ScrollArea className="h-64 rounded-md border border-border">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2 p-2">
          {filteredIcons.map((icon) => (
            <button
              key={`${icon.id}-${icon.contributor}`}
              type="button"
              onClick={() => handleIconClick(icon.id)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 p-2",
                selectedIcon === icon.id
                  ? "border-primary bg-primary/20 shadow-md"
                  : "border-border hover:border-flame hover:bg-accent"
              )}
              title={icon.name}
            >
              <GameIcon iconId={icon.id} className="size-8 fill-foreground" />
            </button>
          ))}
        </div>
      </ScrollArea>

      {showColorPicker && onColorSelect && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Color
          </div>
          <ColorPicker
            selectedColor={selectedColor}
            onColorSelect={(color) => onColorSelect(color || null)}
          />
        </div>
      )}
    </div>
  );
}
