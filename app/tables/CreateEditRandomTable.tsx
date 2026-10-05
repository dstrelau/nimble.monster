"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";
import { saveRandomTable } from "@/app/%5Factions/_random-tables/contract";
import { ConditionValidationIcon } from "@/components/condition/ConditionValidationIcon";
import { VisibilityToggle } from "@/components/shared/VisibilityToggle";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { call } from "@/lib/contract";
import {
  type RandomTableFormData,
  RandomTableSchema,
} from "@/lib/random-table-schema";
import type { RandomTable } from "@/lib/types";
import { cn, randomUUID } from "@/lib/utils";
import { getRandomTableUrl } from "@/lib/utils/url";

interface Props {
  randomTable: RandomTable;
  isCreating?: boolean;
  submitLabel?: string;
  onSubmit?: (data: RandomTableFormData) => void;
}

function createDefaultSubtable(): RandomTableFormData["subtables"][number] {
  return {
    title: "",
    columns: [
      { id: "roll", name: "1d6" },
      { id: "result", name: "Result" },
    ],
    rows: [{ cells: { roll: "", result: "" } }],
  };
}

function SubtableFields({
  subtableIndex,
  onRemove,
  canRemove,
}: {
  subtableIndex: number;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { control, getValues, setValue } =
    useFormContext<RandomTableFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `subtables.${subtableIndex}.rows`,
  });
  const {
    fields: columns,
    append: appendColumn,
    remove: removeColumn,
  } = useFieldArray({
    control,
    name: `subtables.${subtableIndex}.columns`,
    keyName: "fieldKey",
  });

  const addColumn = () => {
    const id = randomUUID();
    const rows = getValues(`subtables.${subtableIndex}.rows`);
    setValue(
      `subtables.${subtableIndex}.rows`,
      rows.map((row) => ({
        ...row,
        cells: { ...row.cells, [id]: "" },
      })),
      { shouldDirty: true }
    );
    appendColumn({ id, name: `Column ${columns.length + 1}` });
  };

  const deleteColumn = (columnIndex: number, columnId: string) => {
    const rows = getValues(`subtables.${subtableIndex}.rows`);
    setValue(
      `subtables.${subtableIndex}.rows`,
      rows.map((row) => ({
        ...row,
        cells: Object.fromEntries(
          Object.entries(row.cells).filter(([id]) => id !== columnId)
        ),
      })),
      { shouldDirty: true }
    );
    removeColumn(columnIndex);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border",
        columns.length > 4 && "md:col-span-2"
      )}
    >
      <div className="flex items-start justify-between gap-3 bg-header p-1.5 text-header-foreground">
        <FormField
          control={control}
          name={`subtables.${subtableIndex}.title`}
          render={({ field }) => (
            <FormItem className="min-w-0 flex-1 gap-1">
              <FormControl>
                <Input
                  aria-label="Table title"
                  className="h-8 border-header-foreground/30 bg-transparent px-2 font-condensed font-bold text-base text-header-foreground shadow-none placeholder:text-header-foreground/60 focus-visible:border-header-foreground/50 focus-visible:ring-header-foreground/30 md:text-base dark:bg-transparent"
                  placeholder="Encounter Difficulty"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex h-8 shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground"
            onClick={addColumn}
          >
            <Plus /> Add column
          </Button>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground"
              onClick={onRemove}
              aria-label="Remove table"
            >
              <Trash />
            </Button>
          )}
        </div>
      </div>
      <Table className="min-w-xl">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column, columnIndex) => (
              <TableHead key={column.fieldKey} className="h-11 min-w-40 p-1.5">
                <div className="flex h-8 items-center gap-1">
                  <FormField
                    control={control}
                    name={`subtables.${subtableIndex}.columns.${columnIndex}.name`}
                    render={({ field }) => (
                      <FormItem className="min-w-0 flex-1 gap-1">
                        <FormControl>
                          <Input
                            aria-label="Column name"
                            className="h-8 bg-transparent font-medium text-muted-foreground shadow-none focus-visible:bg-background dark:bg-transparent dark:focus-visible:bg-input/30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {columns.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                      aria-label={`Remove ${column.name} column`}
                      onClick={() => deleteColumn(columnIndex, column.id)}
                    >
                      <Trash />
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, rowIndex) => (
            <TableRow key={field.id} className="hover:bg-transparent">
              {columns.map((column, columnIndex) => (
                <TableCell
                  key={column.id}
                  className="h-11 whitespace-normal p-1.5 align-top"
                >
                  <div className="flex items-start gap-1">
                    <FormField
                      control={control}
                      name={`subtables.${subtableIndex}.rows.${rowIndex}.cells.${column.id}`}
                      render={({ field }) => (
                        <FormItem className="min-w-0 flex-1 gap-1">
                          <FormControl>
                            <Input
                              aria-label={`${column.name}, row ${rowIndex + 1}`}
                              className="h-8 bg-transparent shadow-none focus-visible:bg-background dark:bg-transparent dark:focus-visible:bg-input/30"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {columnIndex === columns.length - 1 &&
                      (fields.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0"
                          onClick={() => remove(rowIndex)}
                          aria-label={`Remove row ${rowIndex + 1}`}
                        >
                          <Trash />
                        </Button>
                      ) : (
                        <span aria-hidden="true" className="size-8 shrink-0" />
                      ))}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="border-t bg-muted/20 p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            append({
              cells: Object.fromEntries(
                columns.map((column) => [column.id, ""])
              ),
            });
          }}
        >
          <Plus /> Add Row
        </Button>
      </div>
    </div>
  );
}

export function CreateEditRandomTable({
  randomTable,
  isCreating = false,
  submitLabel = "Save",
  onSubmit,
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
        : [createDefaultSubtable()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subtables",
  });

  const handleSubmit = async (data: RandomTableFormData) => {
    if (onSubmit) {
      onSubmit(data);
      return;
    }
    try {
      const result = await call(saveRandomTable, {
        ...data,
        id: isCreating ? undefined : randomTable.id,
      });
      router.push(getRandomTableUrl(result));
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error ? error.message : "Failed to save table",
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
            onClick={() => append(createDefaultSubtable())}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Table
          </Button>
        </div>
      </form>
    </Form>
  );
}
