"use client";

import { Table2 } from "lucide-react";
import { useState } from "react";
import { ModeToggle } from "@/components/layout/ModeToggle";
import { CardFooterLayout } from "@/components/shared/CardFooterLayout";
import { FormattedText } from "@/components/shared/FormattedText";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { RandomTable } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CARD_FIXTURES } from "./fixtures";

type CardOption = "contents" | "preview" | "columns";

interface DesignOption {
  id: CardOption;
  name: string;
  description: string;
}

const OPTIONS: DesignOption[] = [
  {
    id: "contents",
    name: "A · Contents list",
    description: "Clear hierarchy and row counts. Best for scanning a library.",
  },
  {
    id: "preview",
    name: "B · Data preview",
    description: "A taste of the first table. Most useful when values matter.",
  },
  {
    id: "columns",
    name: "C · Column outline",
    description: "Grouped column labels. Shows what each table covers.",
  },
];

interface OverviewCardProps {
  table: RandomTable;
  option: CardOption;
}

export function OverviewCard({ table, option }: OverviewCardProps) {
  const visibleSubtables = table.subtables.slice(
    0,
    option === "columns" ? 3 : 4
  );
  const remainingTables = table.subtables.length - visibleSubtables.length;
  const firstTable = table.subtables[0];
  const previewColumns = firstTable?.columns.slice(0, 3) ?? [];

  return (
    <Card className="min-w-0" data-design={option}>
      <CardHeader className="gap-3">
        <div className="flex items-start gap-2">
          <Table2 className="mt-1 size-5 shrink-0 text-muted-foreground" />
          <h3 className="min-w-0 break-words font-condensed font-bold text-2xl leading-tight">
            {table.name}
          </h3>
        </div>
        {table.description && (
          <CardDescription className="line-clamp-2">
            <FormattedText
              content={table.description}
              conditions={[]}
              blockStyles={false}
            />
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {option === "contents" && (
          <ul className="divide-y rounded-lg border px-3">
            {visibleSubtables.map((subtable, index) => (
              <li
                key={subtable.id ?? index}
                className="flex items-start justify-between gap-3 py-3"
              >
                <p className="min-w-0 break-words font-semibold text-sm">
                  {subtable.title}
                </p>
                <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                  {subtable.rows.length} rows
                </span>
              </li>
            ))}
            {remainingTables > 0 && (
              <li className="py-2 text-muted-foreground text-xs">
                +{remainingTables} more{" "}
                {remainingTables === 1 ? "table" : "tables"}
              </li>
            )}
          </ul>
        )}
        {option === "preview" && firstTable && (
          <div className="space-y-2">
            <p className="break-words font-semibold text-sm">
              {firstTable.title}
            </p>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full table-fixed text-left text-xs">
                <caption className="sr-only">{firstTable.title} sample</caption>
                <thead className="bg-muted/50">
                  <tr>
                    {previewColumns.map((column) => (
                      <th
                        key={column.id}
                        scope="col"
                        className="break-words px-2 py-2 font-semibold align-top"
                      >
                        {column.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {firstTable.rows.slice(0, 2).map((row, index) => (
                    <tr key={row.id ?? index}>
                      {previewColumns.map((column) => (
                        <td key={column.id} className="px-2 py-2 align-top">
                          <div className="line-clamp-2 break-words">
                            <FormattedText
                              content={row.cells[column.id] ?? ""}
                              conditions={[]}
                              blockStyles={false}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-xs">
              {firstTable.rows.length > 2 && (
                <span>
                  +{firstTable.rows.length - 2} more{" "}
                  {firstTable.rows.length === 3 ? "row" : "rows"}
                </span>
              )}
              {firstTable.columns.length > 3 && (
                <span>
                  +{firstTable.columns.length - 3} more{" "}
                  {firstTable.columns.length === 4 ? "column" : "columns"}
                </span>
              )}
              {table.subtables.length > 1 && (
                <span>
                  +{table.subtables.length - 1} other{" "}
                  {table.subtables.length === 2 ? "table" : "tables"}
                </span>
              )}
            </div>
          </div>
        )}
        {option === "columns" && (
          <div className="space-y-3">
            {visibleSubtables.map((subtable, index) => (
              <section
                key={subtable.id ?? index}
                className="rounded-lg bg-muted/40 p-3"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h4 className="min-w-0 break-words font-semibold text-sm">
                    {subtable.title}
                  </h4>
                  <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                    {subtable.rows.length} rows
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subtable.columns.slice(0, 4).map((column) => (
                    <Badge
                      key={column.id}
                      variant="outline"
                      className="max-w-full whitespace-normal break-words font-normal"
                    >
                      {column.name}
                    </Badge>
                  ))}
                  {subtable.columns.length > 4 && (
                    <span className="self-center text-muted-foreground text-xs">
                      +{subtable.columns.length - 4} columns
                    </span>
                  )}
                </div>
              </section>
            ))}
            {remainingTables > 0 && (
              <p className="text-muted-foreground text-xs">
                +{remainingTables} more{" "}
                {remainingTables === 1 ? "table" : "tables"}
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooterLayout
        creator={table.creator}
        disableLink
        actionsSlot={table.visibility === "private" && <Badge>Private</Badge>}
      />
    </Card>
  );
}

export function ReferenceTableCardLab() {
  const [narrow, setNarrow] = useState(false);

  return (
    <div className="space-y-8 py-6">
      <header className="space-y-3">
        <h1 className="font-slab font-black text-4xl">Reference Table cards</h1>
        <p className="max-w-3xl text-muted-foreground">
          Three overview designs, compared with the same five examples. These
          are development-only previews; the live library cards are unchanged.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <ModeToggle />
          <Label id="preview-width-label">Card width</Label>
          <ToggleGroup
            type="single"
            value={narrow ? "narrow" : "standard"}
            variant="outline"
            size="sm"
            aria-labelledby="preview-width-label"
            onValueChange={(value) => {
              if (value) setNarrow(value === "narrow");
            }}
          >
            <ToggleGroupItem value="standard">Standard</ToggleGroupItem>
            <ToggleGroupItem value="narrow">Narrow</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </header>
      {OPTIONS.map((option) => (
        <section key={option.id} aria-label={option.name} className="space-y-4">
          <div className="border-b pb-2">
            <h2 className="font-slab font-bold text-xl">{option.name}</h2>
            <p className="text-muted-foreground text-sm">
              {option.description}
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-6">
            {CARD_FIXTURES.map((fixture) => (
              <article
                key={fixture.table.name}
                aria-label={`${option.name}: ${fixture.table.name}`}
                className={cn(
                  "min-w-0 w-full space-y-3",
                  narrow ? "max-w-72" : "max-w-96"
                )}
              >
                <p className="text-muted-foreground text-sm">{fixture.label}</p>
                <OverviewCard table={fixture.table} option={option.id} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
