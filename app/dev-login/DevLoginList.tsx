"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface DevUser {
  discordId: string | null;
  username: string | null;
  displayName: string | null;
}

export function DevLoginList({ users }: { users: DevUser[] }) {
  return (
    <div className="flex flex-col gap-2">
      {users
        .filter((u): u is DevUser & { discordId: string } => !!u.discordId)
        .map((u) => (
          <Button
            key={u.discordId}
            variant="outline"
            onClick={() =>
              signIn("dev", { discordId: u.discordId, redirectTo: "/" })
            }
          >
            {u.displayName || u.username || u.discordId}
          </Button>
        ))}
    </div>
  );
}
