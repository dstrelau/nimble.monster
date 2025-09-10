import { cn, levelIntToDisplay } from "@/lib/utils";

interface LevelProps {
  level?: string;
  levelInt?: number;
  className?: string;
}

export function Level({ level, levelInt, className }: LevelProps) {
  const displayLevel =
    levelInt !== undefined ? levelIntToDisplay(levelInt) : level || "";
  const fallbackLevel = levelInt === 0 && level ? level : displayLevel;

  return (
    <span
      className={cn(
        fallbackLevel.includes("/") && "diagonal-fractions",
        className
      )}
    >
      {fallbackLevel}
    </span>
  );
}
