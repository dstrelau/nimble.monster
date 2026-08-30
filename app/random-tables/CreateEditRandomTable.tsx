"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type Control,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { saveRandomTable } from "@/app/%5Factions/_random-tables/contract";
import { ConditionValidationIcon } from "@/components/condition/ConditionValidationIcon";
import { VisibilityToggle } from "@/components/shared/VisibilityToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { call } from "@/lib/contract";
import { parseTableNotation, tableNotationRange } from "@/lib/dice";
import {
  type RandomTableFormData,
  RandomTableSchema,
} from "@/lib/random-table-schema";
import type { RandomTable } from "@/lib/types";
import { getRandomTableUrl } from "@/lib/utils/url";

interface Props {
  randomTable: RandomTable;
  isCreating?: boolean;
  submitLabel?: string;
}

/** The next unused roll value, so adding rows walks up the die's range. */
function nextRollValue(
  rows: { high?: number }[] | undefined,
  range: { min: number; max: number } | null
): number {
  const min = range?.min ?? 1;
  const highest = (rows ?? []).reduce(
    (acc, row) => Math.max(acc, Number(row.high) || min),
    min - 1
  );
  return Math.min(highest + 1, range?.max ?? highest + 1);
}

function SubtableFields({
  control,
  subtableIndex,
  onRemove,
  canRemove,
}: {
  control: Control<RandomTableFormData>;
  subtableIndex: number;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `subtables.${subtableIndex}.rows`,
  });

  const notation = useWatch({
    control,
    name: `subtables.${subtableIndex}.notation`,
  });

  const rows = useWatch({
    control,
    name: `subtables.${subtableIndex}.rows`,
  });

  const roll = notation ? parseTableNotation(notation) : null;
  const range = roll ? tableNotationRange(roll) : null;

  return (
    <Card>
      <CardContent className="space-y-4 px-4">
        <div className="flex items-end gap-2">
          <FormField
            control={control}
            name={`subtables.${subtableIndex}.title`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Encounter Difficulty" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`subtables.${subtableIndex}.notation`}
            render={({ field }) => (
              <FormItem className="w-32">
                <FormLabel>Dice</FormLabel>
                <FormControl>
                  <Input placeholder="2d12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              aria-label="Remove table"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <Label>Rows</Label>
            {range && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {notation} rolls {range.min}–{range.max}
              </span>
            )}
          </div>

          {fields.map((field, rowIndex) => (
            <div key={field.id} className="flex items-start gap-2">
              <FormField
                control={control}
                name={`subtables.${subtableIndex}.rows.${rowIndex}.low`}
                render={({ field: lowField }) => (
                  <FormItem className="w-20">
                    <FormControl>
                      <Input
                        type="number"
                        aria-label="Low roll"
                        className="tabular-nums"
                        {...lowField}
                        value={
                          Number.isNaN(lowField.value) ? "" : lowField.value
                        }
                        onChange={(e) =>
                          lowField.onChange(e.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <span className="pt-2 text-muted-foreground">–</span>
              <FormField
                control={control}
                name={`subtables.${subtableIndex}.rows.${rowIndex}.high`}
                render={({ field: highField }) => (
                  <FormItem className="w-20">
                    <FormControl>
                      <Input
                        type="number"
                        aria-label="High roll"
                        className="tabular-nums"
                        {...highField}
                        value={
                          Number.isNaN(highField.value) ? "" : highField.value
                        }
                        onChange={(e) =>
                          highField.onChange(e.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`subtables.${subtableIndex}.rows.${rowIndex}.result`}
                render={({ field: resultField }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        aria-label="Result"
                        placeholder="Result"
                        {...resultField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(rowIndex)}
                  aria-label="Remove row"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = nextRollValue(rows, range);
              append({ low: next, high: next, result: "" });
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Row
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CreateEditRandomTable({
  randomTable,
  isCreating = false,
  submitLabel = "Save",
}: Props) {
  const router = useRouter();

  const form = useForm<RandomTableFormData>({
    resolver: zodResolver(RandomTableSchema),
    defaultValues: {
      name: randomTable.name,
      description: randomTable.description || "",
      visibility: randomTable.visibility,
      subtables: randomTable.subtables.length
        ? randomTable.subtables
        : [
            {
              title: "",
              notation: "1d6",
              rows: [{ low: 1, high: 1, result: "" }],
            },
          ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subtables",
  });

  const handleSubmit = async (data: RandomTableFormData) => {
    try {
      const result = await call(saveRandomTable, {
        ...data,
        id: isCreating ? undefined : randomTable.id,
      });
      router.push(getRandomTableUrl(result));
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to save random table",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex justify-between gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      className="w-full md:w-80"
                      placeholder="Name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <VisibilityToggle
                    id="random-table-visibility-toggle"
                    checked={field.value === "public"}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? "public" : "private")
                    }
                  />
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isCreating ? "Create" : submitLabel}
              </Button>
            </div>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Description
                  <ConditionValidationIcon text={field.value} />
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="w-full"
                    placeholder="Description"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root && (
          <div className="mb-4 text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="grid items-start gap-6 md:grid-cols-2">
          {fields.map((field, index) => (
            <SubtableFields
              key={field.id}
              control={form.control}
              subtableIndex={index}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              append({
                title: "",
                notation: "1d6",
                rows: [{ low: 1, high: 1, result: "" }],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add Table
          </Button>
        </div>
      </form>
    </Form>
  );
}
