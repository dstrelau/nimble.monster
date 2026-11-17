import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TotalRangeMode = "atLeast" | "atMost" | "between";

interface TotalRangeControlsProps {
  mode: TotalRangeMode;
  min: number | null;
  max: number | null;
  chance: string;
  onModeChange: (mode: TotalRangeMode) => void;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
}

const MODES: Array<{ value: TotalRangeMode; label: string }> = [
  { value: "atLeast", label: "At least" },
  { value: "atMost", label: "At most" },
  { value: "between", label: "Between" },
];

const parseTotal = (value: string) => {
  const total = Number.parseInt(value, 10);
  return Number.isSafeInteger(total) ? total : null;
};

function TotalInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      step={1}
      aria-label={label}
      value={value ?? ""}
      onChange={(e) => onChange(parseTotal(e.target.value))}
      className="h-8 w-16"
    />
  );
}

export function TotalRangeControls({
  mode,
  min,
  max,
  chance,
  onModeChange,
  onMinChange,
  onMaxChange,
}: TotalRangeControlsProps) {
  return (
    <div className="mt-1 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Select
          value={mode}
          onValueChange={(value) => {
            const next = MODES.find((m) => m.value === value);
            if (next) onModeChange(next.value);
          }}
        >
          <SelectTrigger size="sm" className="w-28" aria-label="Total range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {mode !== "atMost" && (
          <TotalInput
            label="Minimum total"
            value={min}
            onChange={onMinChange}
          />
        )}
        {mode === "between" && <span className="text-sm">and</span>}
        {mode !== "atLeast" && (
          <TotalInput
            label="Maximum total"
            value={max}
            onChange={onMaxChange}
          />
        )}
      </div>
      <output
        aria-label="Chance of total in range"
        className="text-lg font-bold tabular-nums"
      >
        {chance}
      </output>
    </div>
  );
}
