import { RuleIndexRow } from "@/components/rules/RuleIndexRow";
import { cn } from "@/lib/utils";

interface RuleIndexSectionProps {
  id?: string;
  label: string;
  color: string;
  rules: {
    slug: string;
    href: string;
    title: string;
  }[];
}

export function RuleIndexSection({
  id,
  label,
  color,
  rules,
}: RuleIndexSectionProps) {
  return (
    <section id={id}>
      <div className={cn("mb-1 border-b-2 border-current pb-2", color)}>
        <h4 className="pl-2 text-sm font-semibold text-muted-foreground">
          {label}
        </h4>
      </div>
      <ul>
        {rules.map((rule) => (
          <RuleIndexRow key={rule.slug} href={rule.href} title={rule.title} />
        ))}
      </ul>
    </section>
  );
}
