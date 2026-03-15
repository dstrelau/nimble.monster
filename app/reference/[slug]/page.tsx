import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReferenceMarkdown } from "@/app/ui/reference/ReferenceMarkdown";
import { getReferenceEntry } from "@/lib/db/reference";
import {
  resolveDiceNotationLinks,
  resolveSpellSchoolLinks,
  resolveTermLinks,
} from "@/lib/reference/crosslinks";
import { previewMap } from "@/lib/reference/terms";
import { SITE_NAME } from "@/lib/utils/branding";
import { AdvantageDisadvantageExamples } from "./AdvantageDisadvantageExamples";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getReferenceEntry(slug);
  if (!entry) return {};
  return { title: `${entry.title} - Rules Reference - ${SITE_NAME}` };
}

export default async function ReferenceEntryPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getReferenceEntry(slug);
  if (!entry) notFound();

  const diceResolved = resolveDiceNotationLinks(entry.content);
  const resolvedContent = await resolveSpellSchoolLinks(diceResolved);
  const linkedMarkdown = resolveTermLinks(resolvedContent);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/reference" className="hover:text-foreground">
          Rules Reference
        </Link>
        <span>/</span>
        <span className="text-foreground">{entry.title}</span>
      </nav>
      <h1 className="mb-6 text-3xl font-bold">{entry.title}</h1>
      <article className="prose dark:prose-invert max-w-none">
        <ReferenceMarkdown content={linkedMarkdown} previewMap={previewMap} />
      </article>
      {slug === "advantage-disadvantage" && <AdvantageDisadvantageExamples />}
    </div>
  );
}
