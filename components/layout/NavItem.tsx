"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}

export function NavItem({ href, label, icon: Icon, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-16 items-center gap-1.5 border-b-2 border-transparent px-3 text-header-foreground hover:border-flame focus:text-header-foreground",
        active && "focus:border-hp border-hp"
      )}
    >
      <Icon className="size-4" />
      <span className="font-slab font-bold">{label}</span>
    </Link>
  );
}
