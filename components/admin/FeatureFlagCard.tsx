"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateFeatureFlag } from "@/app/%5Factions/updateFeatureFlag/contract";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { searchCreators } from "@/components/shared/search-creators-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { call } from "@/lib/contract";
import type { FeatureFlag } from "@/lib/services/featureFlags";
import type { User } from "@/lib/types";

interface FeatureFlagCardProps {
  feature: FeatureFlag;
  users: User[];
}

export function FeatureFlagCard({ feature, users }: FeatureFlagCardProps) {
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
    let cancelled = false;
    searchCreators(query.trim()).then((found) => {
      if (!cancelled) setResults(found);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const enabledIds = new Set(users.map((user) => user.id));

  function save(userId: string, enabled: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await call(updateFeatureFlag, { userId, feature, enabled });
        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to save flag"
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 break-words">
          {feature}
          <Badge variant="secondary">{users.length}</Badge>
        </CardTitle>
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
          ariaLabel={`Add user to ${feature}`}
          className="w-64 shrink-0"
          align="end"
        />
      </CardHeader>
      <CardContent className="space-y-2">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No users have this flag.
          </p>
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
                  aria-label={`Remove @${user.username} from ${feature}`}
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
