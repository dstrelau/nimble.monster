import type { Metadata } from "next";
import { CategoryIcon } from "@/components/rules/CategoryIcon";
import { RuleIndexSection } from "@/components/rules/RuleIndexSection";
import { RuleSearchInput } from "@/components/rules/RuleSearchInput";
import { getAllRules } from "@/lib/rules/filesystem";
import { resolveRuleHierarchy, ruleUrl } from "@/lib/rules/rule-index";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/utils/branding";

export const metadata: Metadata = {
  title: `Rules - ${SITE_NAME}`,
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function RulesPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim();
  const hierarchy = resolveRuleHierarchy(getAllRules());

  return (
    <main className="mx-auto max-w-7xl px-4 pb-8 pt-4 lg:py-8">
      <RuleSearchInput defaultValue={query} />

      <div className="mt-10 space-y-12">
        {hierarchy.map(({ group, categories }) => (
          <section key={group.slug} id={group.slug} className="scroll-mt-20">
            <div className="mb-2 rounded-lg bg-primary px-5 py-4 text-primary-foreground sm:px-6">
              <h2 className="text-2xl font-bold">{group.label}</h2>
            </div>

            <div>
              {categories.map(({ category, sections }) => {
                const categoryRuleCount = sections.reduce(
                  (count, section) => count + section.rules.length,
                  0
                );
                return (
                  <div
                    key={category.slug}
                    id={category.slug}
                    className="grid scroll-mt-20 gap-6 py-8 md:grid-cols-[12rem_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10"
                  >
                    <div className="flex items-start gap-3">
                      <CategoryIcon
                        icon={category.icon}
                        className={cn("mt-0.5 size-5", category.color)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 md:block">
                          <h3 className="font-semibold">{category.label}</h3>
                          <span className="text-xs text-muted-foreground">
                            {categoryRuleCount} rules
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-x-10 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
                      {sections.map(({ section, rules }) => (
                        <RuleIndexSection
                          key={section.slug}
                          id={section.slug}
                          label={section.label}
                          color={category.color}
                          rules={rules.map((rule) => ({
                            slug: rule.slug,
                            href: ruleUrl(rule.slug),
                            title: rule.title,
                          }))}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
