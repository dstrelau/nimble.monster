import type { Metadata } from "next";
import { AllRulesSection } from "@/components/rules/AllRulesSection";
import { CategoryIcon } from "@/components/rules/CategoryIcon";
import { GuideCard } from "@/components/rules/GuideCard";
import { RuleIndexRow } from "@/components/rules/RuleIndexRow";
import { RuleSearchInput } from "@/components/rules/RuleSearchInput";
import { auth } from "@/lib/auth";
import {
  getCustomRuleIndex,
  listPublicCustomRules,
} from "@/lib/db/custom-rule";
import { getAllRules } from "@/lib/rules/filesystem";
import { getGuides } from "@/lib/rules/guides";
import { groupHomebrewByCategory } from "@/lib/rules/homebrew";
import { groupByCategory, ruleUrl } from "@/lib/rules/rule-index";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/utils/branding";
import { getCustomRuleUrl } from "@/lib/utils/url";

export const metadata: Metadata = {
  title: `Rules - ${SITE_NAME}`,
};

interface PageProps {
  searchParams: Promise<{ q?: string; homebrew?: string }>;
}

export default async function RulesPage({ searchParams }: PageProps) {
  const { q, homebrew: homebrewParam } = await searchParams;
  const query = q?.trim();

  const homebrew = homebrewParam === "1";
  const session = await auth();
  const rules = getAllRules();
  const guides = getGuides();
  const { byRule } = await getCustomRuleIndex();
  const categoryGroups = groupByCategory(rules);
  const homebrewByCategory = groupHomebrewByCategory(
    await listPublicCustomRules(session?.user?.id)
  );

  return (
    <main className="mx-auto max-w-7xl px-4 pb-8 pt-4 lg:py-8">
      <RuleSearchInput defaultValue={query} />

      <section className="mt-8">
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
          {guides.map((guide) => (
            <div
              key={guide.slug}
              className="w-72 shrink-0 snap-start md:w-auto"
            >
              <GuideCard guide={guide} />
            </div>
          ))}
        </div>
      </section>

      <AllRulesSection defaultShowHomebrew={homebrew}>
        <div className="flex flex-col gap-8">
          {categoryGroups.map(({ category, rules: group }) => {
            const brews = homebrewByCategory.get(category.slug) ?? [];
            const entries = [
              ...group.map((rule) => ({
                key: rule.slug,
                title: rule.title,
                href: ruleUrl(rule.slug),
                counts: byRule.get(rule.slug),
                homebrew: false,
              })),
              ...brews.map((brew) => ({
                key: brew.id,
                title: brew.name,
                href: getCustomRuleUrl(brew),
                counts: undefined,
                homebrew: true,
              })),
            ].sort((a, b) => a.title.localeCompare(b.title));

            return (
              <div
                key={category.slug}
                id={category.slug}
                className="scroll-mt-20"
              >
                <div className="mb-2 flex items-center gap-2 border-b border-border pb-1">
                  <CategoryIcon
                    icon={category.icon}
                    className={cn("size-5", category.color)}
                  />
                  <h3 className="font-semibold">{category.label}</h3>
                  <span className="text-xs text-muted-foreground">
                    {group.length}
                  </span>
                  {brews.length > 0 && (
                    <span
                      data-homebrew
                      className="text-xs text-muted-foreground"
                    >
                      +{brews.length}
                    </span>
                  )}
                </div>
                <ul className="gap-x-8 lg:columns-2">
                  {entries.map((entry) => (
                    <RuleIndexRow
                      key={entry.key}
                      href={entry.href}
                      title={entry.title}
                      colorClass={category.color}
                      counts={entry.counts}
                      homebrew={entry.homebrew}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </AllRulesSection>
    </main>
  );
}
