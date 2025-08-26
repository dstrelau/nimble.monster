import { CircleSlash2, Shuffle } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { SearchInput } from "@/app/ui/SearchInput";
import { GameIcon } from "@/components/GameIcon";
import { ICON_LIST, ICONS } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface IconPickerDialogProps {
  selectedIcon?: string;
  onIconSelect: (iconId: string | null) => void;
  trigger: React.ReactNode;
}

export function IconPickerDialog({
  selectedIcon,
  onIconSelect,
  trigger,
}: IconPickerDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSearchTerm, setDialogSearchTerm] = useState("");
  const [tempSelection, setTempSelection] = useState<string | null>(
    selectedIcon || null
  );

  // Convert ICONS object to array format for compatibility
  const icons = useMemo(() => {
    return ICON_LIST.map((iconId) => ({
      id: iconId,
      name: ICONS[iconId].name,
      searchName: iconId.replace(/-/g, "").toLowerCase(),
      contributor: ICONS[iconId].contributor,
      componentName: ICONS[iconId].componentName,
    }));
  }, []);

  const randomIcons = useMemo(() => {
    const shuffled = [...icons].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 12);
  }, [icons]);

  const dialogFilteredIcons = useMemo(() => {
    if (!dialogSearchTerm || dialogSearchTerm.length < 3) {
      // Show random icons if no current selection, otherwise show empty
      return selectedIcon ? [] : randomIcons;
    }

    const lowercaseSearch = dialogSearchTerm.toLowerCase().replace(/\s+/g, "");
    return icons.filter(
      (icon) =>
        icon.searchName.includes(lowercaseSearch) ||
        icon.name.toLowerCase().includes(dialogSearchTerm.toLowerCase())
    );
  }, [icons, dialogSearchTerm, selectedIcon, randomIcons]);

  const handleDialogIconClick = (iconId: string) => {
    setTempSelection(iconId);
  };

  const handleDialogClear = () => {
    setTempSelection(null);
  };

  const handleSave = () => {
    onIconSelect(tempSelection);
    setDialogOpen(false);
    setDialogSearchTerm("");
  };

  const handleCancel = () => {
    setTempSelection(selectedIcon || null);
    setDialogOpen(false);
    setDialogSearchTerm("");
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      setTempSelection(selectedIcon || null);
    } else {
      handleCancel();
    }
    setDialogOpen(open);
  };

  const handleRandomize = () => {
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    setTempSelection(randomIcon.id);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex flex-col gap-4 items-center flex-shrink-0">
          <DialogTitle className="hidden">Select Icon</DialogTitle>
          <div className="size-20 flex flex-col items-center justify-center gap-2">
            {tempSelection ? (
              <GameIcon
                iconId={tempSelection}
                className="size-16 stroke-primary"
              />
            ) : (
              <CircleSlash2 className="size-8 stroke-muted-foreground" />
            )}
            <div className="text-sm text-center">
              {icons.find((icon) => icon.id === tempSelection)?.name || "None"}
            </div>
          </div>

          <SearchInput
            value={dialogSearchTerm}
            onChange={setDialogSearchTerm}
            placeholder="Search..."
          />
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-4 gap-3 p-3">
              {dialogFilteredIcons.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => handleDialogIconClick(icon.id)}
                  className={cn(
                    "py-3 hover:bg-accent flex flex-col items-center gap-2 rounded-lg border-2 min-h-[80px]",
                    tempSelection === icon.id
                      ? "border-primary bg-primary/20 shadow-md"
                      : "border-border hover:border-primary/50"
                  )}
                  title={icon.name}
                >
                  <GameIcon
                    iconId={icon.id}
                    className="w-8 h-8 fill-primary stroke-primary-foreground background-primary flex-shrink-0"
                  />
                  <span className="text-xs text-center line-clamp-2 w-full leading-tight">
                    {icon.name}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex sm:justify-between items-center pt-6 flex-shrink-0">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDialogClear}
              disabled={!tempSelection}
            >
              Clear
            </Button>
            <Button type="button" variant="outline" onClick={handleRandomize}>
              <Shuffle className="w-4 h-4 mr-2" />
              Randomize
            </Button>
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
