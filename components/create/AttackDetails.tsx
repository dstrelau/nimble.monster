import { ChevronRight } from "lucide-react";
import { useId } from "react";
import { FormInput, FormSelect } from "@/components/shared/Form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAttackDetails } from "@/lib/text";
import { type AttackMetadata, attackMetadataSchema } from "@/lib/types/attack";

interface Details extends AttackMetadata {
  range?: string;
}

interface AttackDetailsProps {
  value: Details;
  onChange: (value: Details) => void;
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

export function AttackDetails({ value, onChange }: AttackDetailsProps) {
  const id = useId();
  const patch = (fields: Partial<Details>) => onChange({ ...value, ...fields });
  const area = value.area?.shape ?? (value.aoe ? "aoe" : "none");
  const validation = attackMetadataSchema.safeParse(value);

  return (
    <Collapsible className="border-t">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="group h-auto min-h-10 w-full justify-start whitespace-normal text-left"
        >
          <ChevronRight className="shrink-0 group-data-[state=open]:rotate-90" />
          <span className="shrink-0">Attack details</span>
          <span className="font-normal text-muted-foreground">
            {value.attackCount ? `${value.attackCount}× ` : ""}
            {formatAttackDetails(value)}
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 px-2 pb-4 pt-2">
        <TargetFields
          value={value.target}
          optional
          onChange={(target) => patch({ target })}
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${id}-count`}>Attack count</Label>
            <Input
              id={`${id}-count`}
              type="number"
              min={1}
              step={1}
              value={value.attackCount ?? ""}
              onChange={(event) =>
                patch({
                  attackCount:
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                })
              }
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
              patch({
                area:
                  shape === "line"
                    ? {
                        shape,
                        size: value.area?.size ?? 1,
                        width:
                          value.area?.shape === "line"
                            ? (value.area.width ?? 1)
                            : 1,
                      }
                    : shape === "square" || shape === "cone"
                      ? { shape, size: value.area?.size ?? 1 }
                      : undefined,
                aoe: shape === "aoe" ? true : undefined,
              })
            }
          />
        </div>
        {value.area && (
          <div className="space-y-2">
            <FormInput
              label={
                value.area.shape === "square"
                  ? "Side length (spaces)"
                  : "Length (spaces)"
              }
              name={`${id}-size`}
              value={value.area.size}
              onChange={(size) => {
                if (value.area) patch({ area: { ...value.area, size } });
              }}
            />
            {value.area.shape === "line" && (
              <FormInput
                label="Width (spaces)"
                name={`${id}-width`}
                value={value.area.width ?? 1}
                onChange={(width) => {
                  if (value.area?.shape === "line")
                    patch({ area: { ...value.area, width } });
                }}
              />
            )}
          </div>
        )}
        {value.range !== undefined && (
          <FormInput
            label="Legacy range text"
            name={`${id}-legacy`}
            value={value.range}
            onChange={(range) => patch({ range })}
          />
        )}
        <div className="space-y-4 border-t pt-4">
          <Label htmlFor={`${id}-alternative`}>
            <Checkbox
              id={`${id}-alternative`}
              checked={!!value.alternative}
              onCheckedChange={(checked) =>
                patch({
                  alternative: checked
                    ? { name: "", target: { range: 1 } }
                    : undefined,
                })
              }
            />
            Alternative attack
          </Label>
          {value.alternative && (
            <>
              <FormInput
                label="Alternative name"
                name={`${id}-alternative-name`}
                value={value.alternative.name}
                onChange={(name) => {
                  if (value.alternative)
                    patch({ alternative: { ...value.alternative, name } });
                }}
              />
              <TargetFields
                value={value.alternative.target}
                onChange={(target) => {
                  if (target && value.alternative)
                    patch({ alternative: { ...value.alternative, target } });
                }}
              />
              <p className="text-sm text-muted-foreground">
                Shares this action’s damage and attack count.
              </p>
            </>
          )}
        </div>
      </CollapsibleContent>
      {!validation.success && (
        <p role="alert" className="px-2 pb-2 text-sm text-destructive">
          {validation.error.issues.map((issue) => issue.message).join(". ")}
        </p>
      )}
    </Collapsible>
  );
}
