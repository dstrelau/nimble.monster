"use client";

import { History } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MonsterVersionMeta } from "@/lib/services/monsters";

interface MonsterVersionSelectProps {
  versions: MonsterVersionMeta[];
  selectedVersion: number;
}

function versionLabel(version: MonsterVersionMeta): string {
  const base = version.isCurrent
    ? `Version ${version.number} (latest)`
    : `Version ${version.number}`;
  return version.description ? `${base} — ${version.description}` : base;
}

export function MonsterVersionSelect({
  versions,
  selectedVersion,
}: MonsterVersionSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const latest = versions.find((v) => v.isCurrent);

  const handleChange = (value: string) => {
    const nextNumber = Number.parseInt(value, 10);
    const params = new URLSearchParams(searchParams.toString());
    // Selecting the latest version returns to the canonical URL (no ?v param);
    // older versions are deep-linked with ?v=N.
    if (latest && nextNumber === latest.number) {
      params.delete("v");
    } else {
      params.set("v", String(nextNumber));
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <Select value={String(selectedVersion)} onValueChange={handleChange}>
      <SelectTrigger className="w-fit gap-2">
        <History className="size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {versions.map((version) => (
          <SelectItem key={version.number} value={String(version.number)}>
            {versionLabel(version)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
