"use client";

import { Button } from "@/components/ui/button";

interface DevUser {
  username: string | null;
  displayName: string | null;
}

export function DevLoginList({ users }: { users: DevUser[] }) {
  return (
    <div className="flex flex-col gap-2">
      {users
        .filter((u): u is DevUser & { username: string } => !!u.username)
        .map((u) => (
          <Button asChild key={u.username} variant="outline">
            <a
              href={`/api/auth/dev-login?dev-login&username=${encodeURIComponent(u.username)}`}
            >
              {u.displayName || u.username}
            </a>
          </Button>
        ))}
    </div>
  );
}
