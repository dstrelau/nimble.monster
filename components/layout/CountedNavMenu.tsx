"use client";

import { useQuery } from "@tanstack/react-query";
import { NavMenu, type NavMenuItem } from "@/components/layout/NavMenu";

interface CountedNavMenuProps<
  TCounts extends { [K in keyof TCounts]: number },
> {
  label: string;
  items: (Omit<NavMenuItem, "count"> & { countKey: keyof TCounts })[];
  queryKey: string;
  queryFn: () => Promise<TCounts>;
}

export function CountedNavMenu<
  TCounts extends { [K in keyof TCounts]: number },
>({ label, items, queryKey, queryFn }: CountedNavMenuProps<TCounts>) {
  const { data: counts } = useQuery({
    queryKey: [queryKey],
    queryFn,
    staleTime: 60_000,
  });

  const navItems: NavMenuItem[] = items.map(({ countKey, ...item }) => ({
    ...item,
    count: counts?.[countKey],
  }));

  return <NavMenu label={label} items={navItems} />;
}
