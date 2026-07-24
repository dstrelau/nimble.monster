import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { findCustomRule } from "@/lib/db/custom-rule";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify } from "@/lib/utils/slug";
import { CustomRuleActions } from "../CustomRuleActions";
import { CustomRuleBody } from "../CustomRuleBody";
import { referenceSectionTitle } from "../sections";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const uid = deslugify(id);
  const rule = uid ? await findCustomRule(uid) : null;
  if (!rule) return {};
  return { title: `${rule.name} - Custom Rules - ${SITE_NAME}` };
}

export default async function CustomRulePage({ params }: PageProps) {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) notFound();

  const [rule, session] = await Promise.all([findCustomRule(uid), auth()]);
  if (!rule) notFound();

  const isOwner = session?.user?.id === rule.creator.id;
  if (!isOwner && rule.visibility !== "public") notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/custom-rules" className="hover:text-foreground">
          Custom Rules
        </Link>
        <span>/</span>
        <span className="text-foreground">{rule.name}</span>
      </nav>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{rule.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            by {rule.creator.displayName}
          </p>
        </div>
        {isOwner && <CustomRuleActions rule={rule} />}
      </div>

      <CustomRuleBody
        content={rule.content}
        creatorDiscordId={rule.creator.discordId}
      />

      {rule.sectionSlugs.length > 0 && (
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Related rules
          </h2>
          <ul className="flex flex-wrap gap-2">
            {rule.sectionSlugs.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/reference/${slug}`}
                  className="rounded-full border border-border px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {referenceSectionTitle(slug)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
