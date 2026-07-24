import { ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { listPublicCustomRules } from "@/lib/db/custom-rule";
import { SITE_NAME } from "@/lib/utils/branding";
import { getCustomRuleUrl } from "@/lib/utils/url";

export const metadata: Metadata = {
  title: `Custom Rules - ${SITE_NAME}`,
};

export default async function CustomRulesPage() {
  const session = await auth();
  const rules = await listPublicCustomRules(session?.user?.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Custom Rules</h1>
          <p className="mt-1 text-muted-foreground">
            Community house rules and variants
          </p>
        </div>
        {session?.user && (
          <Button asChild>
            <Link href="/custom-rules/new">
              <Plus className="size-4" />
              New Rule
            </Link>
          </Button>
        )}
      </div>

      {rules.length === 0 ? (
        <p className="text-muted-foreground">No custom rules yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {rules.map((rule) => (
            <li key={rule.id}>
              <Link
                href={getCustomRuleUrl(rule)}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{rule.name}</span>
                  <span className="text-xs text-muted-foreground">
                    by {rule.creator.displayName}
                  </span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
