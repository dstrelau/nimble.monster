import { cn } from "@/lib/utils";

interface LevelProps {
  level: string;
  className?: string;
}

export function Level({ level, className }: LevelProps) {
  return (
    <span
      className={cn(level.includes("/") && "diagonal-fractions", className)}
    >
      {level}
    </span>
  );
}
