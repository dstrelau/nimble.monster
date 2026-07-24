import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReferenceMarkdown } from "@/components/reference/ReferenceMarkdown";
import { auth } from "@/lib/auth";
import type {
  CustomRule,
  CustomRuleSectionRelation,
} from "@/lib/db/custom-rule";
import { findCustomRule } from "@/lib/db/custom-rule";
import {
  resolveDiceNotationLinks,
  resolveSpellSchoolLinks,
  resolveTermLinks,
} from "@/lib/reference/crosslinks";
import {
  getPageForSection,
  getSectionBySlug,
} from "@/lib/reference/filesystem";
import { previewMap } from "@/lib/reference/terms";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify } from "@/lib/utils/slug";
import { CustomRuleActions } from "../CustomRuleActions";
import { CustomRuleBody } from "../CustomRuleBody";
import { referenceSectionTitle } from "../sections";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface RenderedSection {
  sectionSlug: string;
  title: string;
  href: string;
  content: string | null;
}

// Resolve a linked section's official content through the same crosslink
// pipeline the reference pages use, so embedded rules render identically.
async function renderLinks(
  links: CustomRule["links"],
  relation: CustomRuleSectionRelation
): Promise<RenderedSection[]> {
  return Promise.all(
    links
      .filter((link) => link.relation === relation)
      .map(async (link) => {
        const section = getSectionBySlug(link.sectionSlug);
        const page = getPageForSection(link.sectionSlug);
        let content: string | null = null;
        if (section) {
          const diceResolved = resolveDiceNotationLinks(section.content);
          const resolved = await resolveSpellSchoolLinks(diceResolved);
          content = resolveTermLinks(resolved);
        }
        return {
          sectionSlug: link.sectionSlug,
          title: referenceSectionTitle(link.sectionSlug),
          href: page
            ? `/reference/${page.slug}#${link.sectionSlug}`
            : `/reference/${link.sectionSlug}`,
          content,
        };
      })
  );
}

function LinkedSections({
  title,
  sections,
}: {
  title: string;
  sections: RenderedSection[];
}) {
  if (sections.length === 0) return null;
  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h2>
      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.sectionSlug}>
            <Link
              href={section.href}
              className="text-base font-semibold hover:underline"
            >
              {section.title}
            </Link>
            {section.content && (
              <blockquote className="mt-2 rounded-md border border-border bg-muted/40 px-4 py-3">
                <article className="prose dark:prose-invert max-w-none">
                  <ReferenceMarkdown
                    content={section.content}
                    previewMap={previewMap}
                  />
                </article>
              </blockquote>
            )}
          </div>
        ))}
      </div>
    </section>
  );
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

  const [replaces, augments] = await Promise.all([
    renderLinks(rule.links, "replaces"),
    renderLinks(rule.links, "augments"),
  ]);

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

      <LinkedSections title="Replaces" sections={replaces} />
      <LinkedSections title="Augments" sections={augments} />
    </div>
  );
}
