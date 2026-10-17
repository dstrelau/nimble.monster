import Link from "next/link";
import { notFound } from "next/navigation";
import { FeatureFlagControl } from "@/components/admin/FeatureFlagControl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAdmin } from "@/lib/auth";
import { getUserByUsername, searchUsers } from "@/lib/db/user";
import {
  FEATURE_FLAGS,
  getEnabledFeatureFlags,
} from "@/lib/services/featureFlags";

interface FeatureFlagsPageProps {
  searchParams: Promise<{
    q?: string | string[];
    username?: string | string[];
  }>;
}

export default async function FeatureFlagsPage({
  searchParams,
}: FeatureFlagsPageProps) {
  if (!(await isAdmin())) notFound();

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const username = typeof params.username === "string" ? params.username : "";
  const [results, user] = await Promise.all([
    query ? searchUsers(query) : [],
    username ? getUserByUsername(username) : null,
  ]);
  const enabledFlags = await getEnabledFeatureFlags(user?.id);

  return (
    <div className="py-8 space-y-8">
      <Link href="/admin" className="text-primary hover:underline">
        Back to Admin
      </Link>
      <h1 className="text-3xl font-bold">Feature Flags</h1>
      <Card>
        <CardHeader>
          <CardTitle>Find a user</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action="/admin/feature-flags" className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="user-search">Username or display name</Label>
              <Input id="user-search" name="q" defaultValue={query} required />
            </div>
            <Button type="submit">Search</Button>
          </form>
          {query && (
            <div>
              {results.length === 0 ? (
                <p className="text-muted-foreground">No users found.</p>
              ) : (
                <>
                  <ul className="divide-y">
                    {results.map((result) => (
                      <li key={result.id} className="py-2">
                        <Link
                          href={`/admin/feature-flags?${new URLSearchParams({ q: query, username: result.username })}`}
                          aria-current={
                            user?.id === result.id ? "page" : undefined
                          }
                          className="text-primary hover:underline"
                        >
                          {result.displayName} (@{result.username})
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {results.length === 20 && (
                    <p className="text-sm text-muted-foreground">
                      Showing up to 20 users. Refine your search if needed.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {username && !user && <p role="alert">User not found.</p>}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>
              {user.displayName} (@{user.username})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Changes apply only to this user. They must refresh the site to
              update feature access in an open tab.
            </p>
            <div className="divide-y">
              {FEATURE_FLAGS.map((feature) => (
                <FeatureFlagControl
                  key={`${user.id}:${feature}`}
                  userId={user.id}
                  feature={feature}
                  enabled={enabledFlags.includes(feature)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
