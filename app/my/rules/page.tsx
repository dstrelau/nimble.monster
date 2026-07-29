import { NotebookPen, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { listCustomRulesForUser } from "@/lib/db/custom-rule";
import { SITE_NAME } from "@/lib/utils/branding";
import { getCustomRuleUrl } from "@/lib/utils/url";

export const metadata: Metadata = {
  title: `My Rules - ${SITE_NAME}`,
};

export default async function MyRulesPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const rules = await listCustomRulesForUser(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <NotebookPen className="size-6 stroke-flame" />
          <h1 className="text-2xl font-bold">My Rules</h1>
        </div>
        <Button asChild>
          <Link href="/custom-rules/new">
            <Plus />
            New Rule
          </Link>
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="font-medium">You haven&apos;t created any rules yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a homebrew rule to adapt the game for your table.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rules.map((rule) => (
            <Link
              key={rule.id}
              href={getCustomRuleUrl(rule)}
              className="group rounded-md border bg-card p-4 text-card-foreground transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold group-hover:underline">
                  {rule.name}
                </h2>
                <VisibilityBadge
                  visibility={rule.visibility}
                  className="shrink-0"
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {rule.links.length === 0
                  ? "No linked official rules"
                  : `${rule.links.length} linked official ${rule.links.length === 1 ? "rule" : "rules"}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
