import { SlidersHorizontal } from "lucide-react";
import { useId, useState } from "react";
import { FormInput, FormSelect } from "@/components/shared/Form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAttackDetails, formatAttackName } from "@/lib/text";
import { type AttackMetadata, attackMetadataSchema } from "@/lib/types/attack";

interface Details extends AttackMetadata {
  range?: string;
}

interface AttackDetailsDialogProps {
  name: string;
  value: Details;
  onChange: (value: Details) => void;
  ability?: boolean;
}

interface TargetFieldsProps {
  value: AttackMetadata["target"];
  onChange: (value: AttackMetadata["target"]) => void;
  optional?: boolean;
}

function TargetFields({
  value,
  onChange,
  optional = false,
}: TargetFieldsProps) {
  const id = useId();
  const kind = value
    ? "reach" in value
      ? "reach"
      : "range" in value
        ? "range"
        : "aura"
    : "none";
  const spaces = value
    ? "reach" in value
      ? value.reach
      : "range" in value
        ? value.range
        : value.aura
    : 1;
  const change = (type: string, distance: number) => {
    if (type === "reach") onChange({ reach: distance });
    else if (type === "range") onChange({ range: distance });
    else if (type === "aura") onChange({ aura: distance });
    else onChange(undefined);
  };
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormSelect
        label="Target"
        name={`${id}-target`}
        selected={kind}
        choices={[
          ...(optional ? [{ value: "none", label: "Not specified" }] : []),
          { value: "reach", label: "Reach" },
          { value: "range", label: "Range" },
          { value: "aura", label: "Aura" },
        ]}
        onChange={(type) => change(type, spaces)}
      />
      {value && (
        <FormInput
          label="Spaces"
          name={`${id}-spaces`}
          value={spaces}
          onChange={(distance) => change(kind, distance)}
        />
      )}
    </div>
  );
}

export function AttackDetailsDialog({
  name,
  value,
  onChange,
  ability = false,
}: AttackDetailsDialogProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Details>(value);
  const [count, setCount] = useState("");
  const [error, setError] = useState("");
  const label = ability ? "Ability details" : "Attack details";
  const area = draft.area?.shape ?? (draft.aoe ? "aoe" : "none");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(value);
          setCount(value.attackCount?.toString() ?? "");
          setError("");
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <SlidersHorizontal />
          {label}…
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-dvh max-w-full flex-col rounded-none p-0 sm:h-auto sm:max-h-[90dvh] sm:max-w-xl sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b p-6 text-left">
          <DialogTitle>
            {name || (ability ? "Ability" : "Action")} — {label.toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            Distances use spaces. Leave unspecified details empty.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const parsed = attackMetadataSchema.safeParse({
              ...draft,
              attackCount: count === "" ? undefined : Number(count),
            });
            if (!parsed.success) {
              setError(
                parsed.error.issues.map((issue) => issue.message).join(". ")
              );
              return;
            }
            onChange({
              target: parsed.data.target,
              area: parsed.data.area,
              aoe: parsed.data.aoe,
              attackCount: parsed.data.attackCount,
              alternative: parsed.data.alternative,
              range: draft.range,
            });
            setOpen(false);
          }}
        >
          <div className="space-y-5 overflow-y-auto p-6">
            <TargetFields
              value={draft.target}
              optional
              onChange={(target) => setDraft({ ...draft, target })}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${id}-count`}>Attack count</Label>
                <Input
                  id={`${id}-count`}
                  type="number"
                  min={1}
                  step={1}
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                />
              </div>
              <FormSelect
                label="Area"
                name={`${id}-area`}
                selected={area}
                choices={[
                  { value: "none", label: "None" },
                  { value: "aoe", label: "Unspecified AoE" },
                  { value: "square", label: "Square" },
                  { value: "cone", label: "Cone" },
                  { value: "line", label: "Line" },
                ]}
                onChange={(shape) =>
                  setDraft({
                    ...draft,
                    area:
                      shape === "square" || shape === "cone" || shape === "line"
                        ? { shape, size: draft.area?.size ?? 1 }
                        : undefined,
                    aoe: shape === "aoe" ? true : undefined,
                  })
                }
              />
            </div>
            {draft.area && (
              <div className="space-y-2">
                <FormInput
                  label={
                    draft.area.shape === "square"
                      ? "Side length (spaces)"
                      : "Length (spaces)"
                  }
                  name={`${id}-size`}
                  value={draft.area.size}
                  onChange={(size) => {
                    if (draft.area)
                      setDraft({ ...draft, area: { ...draft.area, size } });
                  }}
                />
                {draft.area.shape === "line" && (
                  <p className="text-sm text-muted-foreground">
                    Lines are always one space wide.
                  </p>
                )}
              </div>
            )}
            {draft.range !== undefined && (
              <div className="space-y-2">
                <FormInput
                  label="Legacy range text"
                  name={`${id}-legacy`}
                  value={draft.range}
                  onChange={(range) => setDraft({ ...draft, range })}
                />
                <p className="text-sm text-muted-foreground">
                  Preserved as written; a structured target takes precedence.
                </p>
              </div>
            )}
            <div className="space-y-4 border-t pt-4">
              <Label htmlFor={`${id}-alternative`}>
                <Checkbox
                  id={`${id}-alternative`}
                  checked={!!draft.alternative}
                  onCheckedChange={(checked) =>
                    setDraft({
                      ...draft,
                      alternative: checked
                        ? { name: "", target: { range: 1 } }
                        : undefined,
                    })
                  }
                />
                Alternative attack
              </Label>
              {draft.alternative && (
                <>
                  <FormInput
                    label="Alternative name"
                    name={`${id}-alternative-name`}
                    value={draft.alternative.name}
                    onChange={(alternativeName) => {
                      if (draft.alternative)
                        setDraft({
                          ...draft,
                          alternative: {
                            ...draft.alternative,
                            name: alternativeName,
                          },
                        });
                    }}
                  />
                  <TargetFields
                    value={draft.alternative.target}
                    onChange={(target) => {
                      if (target && draft.alternative)
                        setDraft({
                          ...draft,
                          alternative: { ...draft.alternative, target },
                        });
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    Shares this action’s damage and attack count.
                  </p>
                </>
              )}
            </div>
            <p className="border-t pt-4 text-sm">
              {formatAttackName({
                name: name || "Action",
                attackCount: Number(count) || undefined,
              })}{" "}
              {formatAttackDetails(draft)}
            </p>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="mt-auto shrink-0 flex-row border-t p-4 sm:p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Apply</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
