import { Badge } from "@/components/ui/badge";
import { resolveRuleContent } from "@/lib/rules/crosslinks";
import { type RuleFaq, ruleFaqAnchor } from "@/lib/rules/faqs";
import { previewMap } from "@/lib/rules/terms";
import { HashHighlight } from "./HashHighlight";
import { RuleMarkdown } from "./RuleMarkdown";
import { RuleSectionHeading } from "./RuleSectionHeading";
import { RuleSources } from "./RuleSources";

export async function RuleContent({ content }: { content: string }) {
  const resolved = await resolveRuleContent(content);
  return (
    <article className="prose dark:prose-invert min-w-0 max-w-none">
      <RuleMarkdown content={resolved} previewMap={previewMap} />
    </article>
  );
}

export function RuleFaqs({ faqs }: { faqs: RuleFaq[] }) {
  if (faqs.length === 0) return null;
  return (
    <section className="mt-10">
      <RuleSectionHeading title="FAQs" count={faqs.length} />
      <div className="space-y-10">
        {faqs.map((faq) => (
          <HashHighlight key={faq.slug} id={ruleFaqAnchor(faq.slug)}>
            <section id={ruleFaqAnchor(faq.slug)} className="scroll-mt-20">
              <div className="mb-5 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold">{faq.question}</h3>
                  <Badge variant="secondary">
                    {faq.kind === "official" ? "Official" : "Common Question"}
                  </Badge>
                </div>
                <RuleSources sources={faq.sources} />
              </div>
              <RuleContent content={faq.answer} />
            </section>
          </HashHighlight>
        ))}
      </div>
    </section>
  );
}
