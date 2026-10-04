"use client";

import { FormattedText } from "@/components/shared/FormattedText";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Condition, Subtable } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SubtableViewProps {
  subtable: Subtable;
  conditions: Condition[];
  className?: string;
}

export function SubtableView({
  subtable,
  conditions,
  className,
}: SubtableViewProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <div className="flex h-11 items-center bg-header px-3.5 text-header-foreground">
        <span className="font-condensed font-bold text-base">
          {subtable.title}
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {subtable.columns.map((column) => (
              <TableHead key={column.id} className="h-11 min-w-32 p-1.5">
                <div className="flex h-8 items-center border border-transparent px-3">
                  {column.name}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {subtable.rows.map((row, index) => (
            <TableRow key={row.id ?? index} className="hover:bg-transparent">
              {subtable.columns.map((column) => (
                <TableCell
                  key={column.id}
                  className="h-11 whitespace-normal p-1.5"
                >
                  <div className="flex min-h-8 items-center border border-transparent px-3">
                    {row.cells[column.id] ? (
                      <FormattedText
                        content={row.cells[column.id]}
                        conditions={conditions}
                        blockStyles={false}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
