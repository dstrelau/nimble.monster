import { cn } from "@/lib/utils";

interface LevelProps {
  level: string;
  lvl: boolean;
  className?: string;
}

export function Level({ level, lvl = true, className }: LevelProps) {
  return (
    <span
      className={cn(level.includes("/") && "diagonal-fractions", className)}
    >
      {level}
    </span>
  );
}
