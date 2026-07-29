import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RuleCustomRules } from "@/components/rules/RuleCustomRules";
import { RuleMarkdown } from "@/components/rules/RuleMarkdown";
import { resolveRuleContent } from "@/lib/rules/crosslinks";
import { GUIDES, getGuide } from "@/lib/rules/guides";
import { ruleUrl } from "@/lib/rules/rule-index";
import { previewMap } from "@/lib/rules/terms";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/utils/branding";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    title: `${guide.title} - Rules - ${SITE_NAME}`,
    description: guide.summary,
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) redirect("/rules");

  const contents = await Promise.all(
    guide.rules.map((rule) => resolveRuleContent(rule.content))
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/rules" className="hover:text-foreground">
          Rules
        </Link>
        <span>/</span>
        <span className="text-foreground">{guide.title}</span>
      </nav>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span
          className={cn("size-2 rounded-full bg-current", guide.category.color)}
        />
        Guide
      </div>
      <h1 className="mt-2 text-3xl font-bold">{guide.title}</h1>
      <p className="mt-1 text-muted-foreground">{guide.summary}</p>

      <ol className="mt-6 flex flex-col rounded-lg border border-border p-2">
        {guide.rules.map((rule, i) => (
          <li key={rule.slug}>
            <a
              href={`#${rule.slug}`}
              className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <span className="w-4 text-right text-xs text-muted-foreground">
                {i + 1}
              </span>
              {rule.title}
            </a>
          </li>
        ))}
      </ol>

      {guide.rules.map((rule, i) => (
        <section
          key={rule.slug}
          id={rule.slug}
          className="mt-10 scroll-mt-20 border-t border-border pt-6"
        >
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-bold">{rule.title}</h2>
            <Link
              href={ruleUrl(rule.slug)}
              className="shrink-0 text-sm text-muted-foreground underline hover:text-foreground"
            >
              Permalink
            </Link>
          </div>
          <article className="prose dark:prose-invert max-w-none">
            <RuleMarkdown content={contents[i]} previewMap={previewMap} />
          </article>
        </section>
      ))}

      <RuleCustomRules ruleSlugs={guide.ruleSlugs} />
    </div>
  );
}
