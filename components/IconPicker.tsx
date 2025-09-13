import { CircleSlash2 } from "lucide-react";
import { useMemo } from "react";
import { FG_COLOR_CLASSES } from "@/app/ui/item/Card";
import { GameIcon } from "@/components/GameIcon";
import { ICONS } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconPickerDialog } from "./IconPickerDialog";

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
  const icons = useMemo(() => {
    return ICONS.map((icon) => ({
      ...icon,
      searchName: icon.id.replace(/-/g, "").toLowerCase(),
    }));
  }, []);

  const selectedIconData = icons.find((icon) => icon.id === selectedIcon);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-2">
          <IconPickerDialog
            selectedIcon={selectedIcon}
            selectedColor={selectedColor}
            onIconSelect={onIconSelect}
            onColorSelect={onColorSelect}
            showColorPicker={showColorPicker}
            trigger={
              <Button
                className="h-24 w-24 border-2 border-border p-2"
                variant="ghost"
              >
                {selectedIconData ? (
                  <GameIcon
                    iconId={selectedIconData.id}
                    className={cn(
                      "size-full stroke-4",
                      selectedColor
                        ? FG_COLOR_CLASSES[selectedColor]
                        : "fill-foreground"
                    )}
                  />
                ) : (
                  <CircleSlash2 className="w-12 h-12 stroke-muted-foreground" />
                )}
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
