"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReferenceSearchInputProps {
  defaultValue?: string;
}

export function ReferenceSearchInput({
  defaultValue = "",
}: ReferenceSearchInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) {
      router.push(`/reference?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/reference");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search rules…"
        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
      />
    </form>
  );
}
