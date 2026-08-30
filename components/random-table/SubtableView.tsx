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
import type { Condition, Subtable, SubtableRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function formatRollRange(row: SubtableRow): string {
  return row.low === row.high ? `${row.low}` : `${row.low}-${row.high}`;
}

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
      <Table>
        <TableHeader>
          <TableRow className="bg-header hover:bg-header">
            <TableHead
              colSpan={2}
              className="h-auto py-2.5 font-condensed font-bold text-base text-header-foreground"
            >
              {subtable.title}{" "}
              <span className="font-normal text-sm tabular-nums">
                [{subtable.notation}]
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subtable.rows.map((row, index) => (
            <TableRow key={row.id ?? `${row.low}-${row.high}-${index}`}>
              <TableCell className="w-16 border-r align-top font-bold tabular-nums">
                {formatRollRange(row)}
              </TableCell>
              <TableCell className="whitespace-normal">
                <FormattedText content={row.result} conditions={conditions} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
