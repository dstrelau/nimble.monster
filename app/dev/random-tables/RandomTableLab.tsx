"use client";

import { Eye, Plus, RotateCcw, TableProperties, Trash } from "lucide-react";
import { Fragment, useState } from "react";
import { FormattedText } from "@/components/shared/FormattedText";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Condition } from "@/lib/types";
import { randomUUID } from "@/lib/utils";

type FixtureName = "weapons" | "encounters";

interface PlaygroundColumn {
  id: string;
  name: string;
}

interface PlaygroundRow {
  id: string;
  cells: Record<string, string>;
}

interface PlaygroundTable {
  title: string;
  columns: PlaygroundColumn[];
  rows: PlaygroundRow[];
}

const WEAPONS_FIXTURE: PlaygroundTable = {
  title: "Weapons",
  columns: [
    { id: "weapon", name: "Weapon" },
    { id: "price", name: "Price" },
    { id: "damage", name: "Damage" },
  ],
  rows: [
    {
      id: "weapon-1",
      cells: { weapon: "Dagger", price: "5 gp", damage: "1d4" },
    },
    {
      id: "weapon-2",
      cells: { weapon: "Shortsword", price: "10 gp", damage: "1d6" },
    },
    {
      id: "weapon-3",
      cells: { weapon: "Longbow", price: "50 gp", damage: "1d8" },
    },
  ],
};

const ENCOUNTERS_FIXTURE: PlaygroundTable = {
  title: "Road Encounters — 1d6",
  columns: [
    { id: "roll", name: "Roll" },
    { id: "encounter", name: "Encounter" },
    { id: "detail", name: "Complication" },
  ],
  rows: [
    {
      id: "encounter-1",
      cells: {
        roll: "1",
        encounter: "A merchant with a broken cart",
        detail: "Their cargo is attracting hungry crows",
      },
    },
    {
      id: "encounter-2",
      cells: {
        roll: "2–3",
        encounter: "A rain-swollen ford",
        detail: "The bridge is guarded by nervous militia",
      },
    },
    {
      id: "encounter-3",
      cells: {
        roll: "4–5",
        encounter: "Fresh tracks leave the road",
        detail: "One set of prints suddenly disappears",
      },
    },
    {
      id: "encounter-4",
      cells: {
        roll: "6",
        encounter: "An abandoned roadside shrine",
        detail: "A recent offering is still warm",
      },
    },
  ],
};

const FIXTURES: Record<FixtureName, PlaygroundTable> = {
  weapons: WEAPONS_FIXTURE,
  encounters: ENCOUNTERS_FIXTURE,
};

const NO_CONDITIONS: Condition[] = [];

function isFixtureName(value: string): value is FixtureName {
  return value === "weapons" || value === "encounters";
}

interface EditorProps {
  table: PlaygroundTable;
  onTableChange: (table: PlaygroundTable) => void;
}

function EditableTableTitle({
  table,
  onTableChange,
}: Pick<EditorProps, "table" | "onTableChange">) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        aria-label="Table title"
        className="h-8 border-header-foreground/30 bg-transparent px-2 font-condensed font-bold text-base text-header-foreground shadow-none placeholder:text-header-foreground/60 focus-visible:border-header-foreground/50 focus-visible:ring-header-foreground/30 md:text-base dark:bg-transparent"
        placeholder="Untitled table"
        value={table.title}
        onChange={(event) =>
          onTableChange({ ...table, title: event.target.value })
        }
      />
    </div>
  );
}

function GridEditor({
  table,
  onTableChange,
  isEditing,
}: EditorProps & { isEditing: boolean }) {
  const updateColumn = (columnId: string, name: string) => {
    onTableChange({
      ...table,
      columns: table.columns.map((column) =>
        column.id === columnId ? { ...column, name } : column
      ),
    });
  };

  const updateRow = (rowId: string, update: Partial<PlaygroundRow>) => {
    onTableChange({
      ...table,
      rows: table.rows.map((row) =>
        row.id === rowId ? { ...row, ...update } : row
      ),
    });
  };

  const addColumn = () => {
    const number = table.columns.length + 1;
    onTableChange({
      ...table,
      columns: [
        ...table.columns,
        { id: randomUUID(), name: `Column ${number}` },
      ],
    });
  };

  const removeColumn = (columnId: string) => {
    onTableChange({
      ...table,
      columns: table.columns.filter((column) => column.id !== columnId),
      rows: table.rows.map((row) => ({
        ...row,
        cells: Object.fromEntries(
          Object.entries(row.cells).filter(([id]) => id !== columnId)
        ),
      })),
    });
  };

  const addRow = () => {
    const row: PlaygroundRow = {
      id: randomUUID(),
      cells: Object.fromEntries(table.columns.map((column) => [column.id, ""])),
    };
    onTableChange({ ...table, rows: [...table.rows, row] });
  };

  const removeRow = (rowId: string) => {
    if (table.rows.length === 1) return;
    const rows = table.rows.filter((row) => row.id !== rowId);
    onTableChange({ ...table, rows });
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table className="min-w-2xl">
        <TableHeader>
          <TableRow className="bg-header hover:bg-header">
            <TableHead
              colSpan={table.columns.length}
              className="h-auto p-1.5 text-header-foreground"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <EditableTableTitle
                      table={table}
                      onTableChange={onTableChange}
                    />
                  ) : (
                    <div className="flex h-8 items-center gap-1.5 border border-transparent px-2 font-condensed font-bold text-base">
                      <FormattedText
                        content={table.title || "Untitled table"}
                        conditions={NO_CONDITIONS}
                        blockStyles={false}
                      />
                    </div>
                  )}
                </div>
                <div className="flex h-8 items-center gap-1">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground"
                      aria-label="Add column"
                      onClick={addColumn}
                    >
                      <Plus /> Add column
                    </Button>
                  )}
                </div>
              </div>
            </TableHead>
          </TableRow>
          <TableRow className="hover:bg-transparent">
            {table.columns.map((column) => (
              <TableHead key={column.id} className="group h-11 min-w-40 p-1.5">
                <div className="flex h-8 items-center gap-1">
                  {isEditing ? (
                    <Input
                      aria-label="Column name"
                      className="h-8 flex-1 border-input bg-transparent font-medium text-muted-foreground shadow-none focus-visible:bg-background dark:bg-transparent dark:focus-visible:bg-input/30"
                      value={column.name}
                      onChange={(event) =>
                        updateColumn(column.id, event.target.value)
                      }
                    />
                  ) : (
                    <div className="flex h-8 flex-1 items-center border border-transparent px-3">
                      {column.name || "Untitled"}
                    </div>
                  )}
                  {table.columns.length > 1 &&
                    (isEditing ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                        aria-label={`Remove ${column.name} column`}
                        onClick={() => removeColumn(column.id)}
                      >
                        <Trash />
                      </Button>
                    ) : (
                      <span aria-hidden="true" className="size-8 shrink-0" />
                    ))}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((row, rowIndex) => (
            <TableRow key={row.id} className="hover:bg-transparent">
              {table.columns.map((column, columnIndex) => (
                <TableCell
                  key={column.id}
                  className="h-11 whitespace-normal p-1.5"
                >
                  <div className="flex h-8 items-center gap-1">
                    {isEditing ? (
                      <Input
                        aria-label={`${column.name}, row ${rowIndex + 1}`}
                        className="h-8 flex-1 border-input bg-transparent shadow-none focus-visible:bg-background dark:bg-transparent dark:focus-visible:bg-input/30"
                        value={row.cells[column.id] ?? ""}
                        onChange={(event) =>
                          updateRow(row.id, {
                            cells: {
                              ...row.cells,
                              [column.id]: event.target.value,
                            },
                          })
                        }
                      />
                    ) : (
                      <div className="flex h-8 flex-1 items-center border border-transparent px-3">
                        {row.cells[column.id] ? (
                          <FormattedText
                            content={row.cells[column.id]}
                            conditions={NO_CONDITIONS}
                            blockStyles={false}
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    )}
                    {columnIndex === table.columns.length - 1 &&
                      (isEditing ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0"
                          disabled={table.rows.length === 1}
                          aria-label={`Remove row ${rowIndex + 1}`}
                          onClick={() => removeRow(row.id)}
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
      {isEditing && (
        <div className="border-t bg-muted/20 p-2">
          <Button type="button" variant="ghost" size="sm" onClick={addRow}>
            <Plus /> Add row
          </Button>
        </div>
      )}
    </div>
  );
}

function StackedPreview({ table }: Pick<EditorProps, "table">) {
  return (
    <div className="space-y-3">
      <h3 className="font-condensed font-bold text-xl">
        <FormattedText
          content={table.title || "Untitled table"}
          conditions={NO_CONDITIONS}
          blockStyles={false}
        />
      </h3>
      <div className="space-y-3">
        {table.rows.map((row, index) => (
          <Fragment key={row.id}>
            <div className="px-3">
              <dl className="grid grid-cols-[minmax(5rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
                {table.columns.map((column) => (
                  <div key={column.id} className="contents">
                    <dt className="font-medium text-muted-foreground">
                      {column.name || "Untitled"}
                    </dt>
                    <dd>
                      {row.cells[column.id] ? (
                        <FormattedText
                          content={row.cells[column.id]}
                          conditions={NO_CONDITIONS}
                          blockStyles={false}
                        />
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            {index < table.rows.length - 1 && (
              <hr className="mx-auto w-3/5 border-border" />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function RandomTableLab() {
  const [fixture, setFixture] = useState<FixtureName>("weapons");
  const [table, setTable] = useState<PlaygroundTable>(FIXTURES.weapons);
  const [showPreview, setShowPreview] = useState(false);

  const chooseFixture = (value: string) => {
    if (!isFixtureName(value)) return;
    const next = FIXTURES[value];
    setFixture(value);
    setTable(next);
  };

  const reset = () => {
    const next = FIXTURES[fixture];
    setTable(next);
  };

  const editorProps: EditorProps = {
    table,
    onTableChange: setTable,
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="font-semibold text-muted-foreground text-sm uppercase tracking-widest">
          Development lab
        </p>
        <h1 className="font-slab font-black text-4xl">
          Table editor playground
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Explore one flexible table format with inline formatting and dice
          notation. Changes stay in this browser and are not saved.
        </p>
      </header>

      <section
        aria-label="Playground fixtures"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Label id="fixture-label">Starting point</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={fixture}
            aria-labelledby="fixture-label"
            onValueChange={chooseFixture}
          >
            <ToggleGroupItem value="weapons">Weapons</ToggleGroupItem>
            <ToggleGroupItem value="encounters">
              Road encounters
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          <RotateCcw /> Reset example
        </Button>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableProperties className="size-5" /> Table
            </CardTitle>
            <CardDescription>
              Edit directly in the table, then toggle its rendered preview.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex justify-end">
              <Toggle
                type="button"
                variant="outline"
                pressed={showPreview}
                onPressedChange={setShowPreview}
                aria-label="Toggle preview"
              >
                <Eye /> Preview
              </Toggle>
            </div>
            <GridEditor {...editorProps} isEditing={!showPreview} />
          </CardContent>
        </Card>

        <Card className="min-w-0 xl:sticky xl:top-4">
          <CardHeader>
            <CardTitle>Stacked preview</CardTitle>
            <CardDescription>
              A narrow-screen-friendly alternative using the same data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StackedPreview table={table} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
