import { CircleSlash2 } from "lucide-react";
import { useMemo } from "react";
import { GameIcon } from "@/components/GameIcon";
import { ICON_LIST, ICONS } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { IconPickerDialog } from "./IconPickerDialog";

interface IconPickerProps {
  selectedIcon?: string;
  onIconSelect: (iconId: string | null) => void;
}

export function IconPicker({ selectedIcon, onIconSelect }: IconPickerProps) {
  const icons = useMemo(() => {
    return ICON_LIST.map((iconId) => ({
      id: iconId,
      name: ICONS[iconId].name,
      searchName: iconId.replace(/-/g, "").toLowerCase(),
      contributor: ICONS[iconId].contributor,
      componentName: ICONS[iconId].componentName,
    }));
  }, []);

  const selectedIconData = icons.find((icon) => icon.id === selectedIcon);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-2">
          <IconPickerDialog
            selectedIcon={selectedIcon}
            onIconSelect={onIconSelect}
            trigger={
              <Button
                className="h-24 w-24 border-2 border-primary-foreground p-2"
                variant="ghost"
              >
                {selectedIconData ? (
                  <GameIcon
                    iconId={selectedIconData.id}
                    className="size-full stroke-primary-foreground background-primary"
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
