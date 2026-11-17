"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { searchCreators } from "@/app/%5Factions/searchCreators/contract";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { call } from "@/lib/contract";
import type { User } from "@/lib/types";

interface UserAccessCardProps {
  /** Names the flag or permission in the title and control labels. */
  name: string;
  description?: string;
  users: User[];
  emptyMessage: string;
  onChange: (userId: string, enabled: boolean) => Promise<unknown>;
}

/** Lists users who have a flag or permission, with controls to add and remove them. */
export function UserAccessCard({
  name,
  description,
  users,
  emptyMessage,
  onChange,
}: UserAccessCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rawQuery, setRawQuery] = useState("");
  const [query] = useDebouncedValue(rawQuery, { wait: 250 });
  const [results, setResults] = useState<User[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    call(searchCreators, { query: query.trim() }, { signal: controller.signal })
      .then((found) => {
        if (!controller.signal.aborted) setResults(found);
      })
      .catch(() => {
        // Keep existing results; changing the search retries the read.
      });
    return () => controller.abort();
  }, [query]);

  const enabledIds = new Set(users.map((user) => user.id));

  function save(userId: string, enabled: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await onChange(userId, enabled);
        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to save");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 break-words">
            {name}
            <Badge variant="secondary">{users.length}</Badge>
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Combobox
          groups={[
            {
              items: results
                .filter((user) => !enabledIds.has(user.id))
                .map((user) => ({
                  id: user.id,
                  label: user.displayName,
                  user,
                })),
            },
          ]}
          value={undefined}
          onSelect={(item) => save(item.id, true)}
          onSearch={setRawQuery}
          renderItem={({ user }) => (
            <span className="flex min-w-0 items-center gap-2">
              <UserAvatar user={user} size={20} />
              <span className="truncate">{user.displayName}</span>
              <span className="text-muted-foreground">@{user.username}</span>
            </span>
          )}
          placeholder="Add user"
          searchPlaceholder="Search users..."
          emptyMessage={query.trim() ? "No users found." : "Type to search."}
          ariaLabel={`Add user to ${name}`}
          className="w-64 shrink-0"
          align="end"
        />
      </CardHeader>
      <CardContent className="space-y-2">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="divide-y">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-4 py-2"
              >
                <span className="flex min-w-0 items-center gap-2 truncate">
                  <UserAvatar user={user} size={20} />
                  {user.displayName}{" "}
                  <span className="text-muted-foreground">
                    @{user.username}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  onClick={() => save(user.id, false)}
                  aria-label={`Remove @${user.username} from ${name}`}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
