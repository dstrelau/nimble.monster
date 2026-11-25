"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DevUser {
  username: string | null;
  displayName: string | null;
}

export function DevLoginList({ users }: { users: DevUser[] }) {
  const [filter, setFilter] = useState("");
  const query = filter.trim().toLowerCase();

  const visible = users
    .filter((u): u is DevUser & { username: string } => !!u.username)
    .filter((u) => u.username.toLowerCase().includes(query))
    .sort((a, b) => a.username.localeCompare(b.username));

  return (
    <div className="flex flex-col gap-2">
      <Input
        autoFocus
        type="search"
        placeholder="Filter by username"
        aria-label="Filter by username"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {visible.map((u) => (
        <Button asChild key={u.username} variant="outline">
          <a
            href={`/api/auth/dev-login?dev-login&username=${encodeURIComponent(u.username)}`}
          >
            <span>{u.displayName || u.username}</span>
            <span className="text-muted-foreground">@{u.username}</span>
          </a>
        </Button>
      ))}
    </div>
  );
}
