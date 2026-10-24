import { type LucideIcon, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type MyLibraryPageHeaderProps = {
  icon: LucideIcon;
  title: string;
} & (
  | { newHref: string; newLabel: string; children?: never }
  | { newHref?: never; newLabel?: never; children?: ReactNode }
);

export function MyLibraryPageHeader({
  icon: Icon,
  title,
  newHref,
  newLabel,
  children,
}: MyLibraryPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Icon className="size-6 stroke-flame" />
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      {newHref ? (
        <Button asChild>
          <Link href={newHref}>
            <Plus />
            {newLabel}
          </Link>
        </Button>
      ) : (
        children
      )}
    </div>
  );
}
