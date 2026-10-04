import type { Condition, Subtable } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SubtableView } from "./SubtableView";

interface SubtablesViewProps {
  subtables: Subtable[];
  conditions: Condition[];
}

export function SubtablesView({ subtables, conditions }: SubtablesViewProps) {
  return (
    <div className="grid items-start gap-6 md:grid-cols-2 print:grid-cols-2">
      {subtables.map((subtable, index) => (
        <SubtableView
          key={subtable.id ?? `${subtable.title}-${index}`}
          subtable={subtable}
          conditions={conditions}
          className={cn(subtable.columns.length > 4 && "md:col-span-2")}
        />
      ))}
    </div>
  );
}
