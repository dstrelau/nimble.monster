import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface RuleIndexRowProps {
  href: string;
  title: string;
}

export function RuleIndexRow({ href, title }: RuleIndexRowProps) {
  return (
    <li className="break-inside-avoid">
      <Link
        href={href}
        className="-ml-0.5 my-1.5 flex items-center gap-3 border-l-2 border-transparent py-1 pr-2 pl-2 transition-colors hover:border-flame"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {title}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground lg:hidden" />
      </Link>
    </li>
  );
}
