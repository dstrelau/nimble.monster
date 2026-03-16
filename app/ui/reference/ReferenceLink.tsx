"use client";

import { WandSparkles } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { DiceNotation } from "@/components/DiceNotation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ReferenceLinkProps {
  href?: string;
  children?: React.ReactNode;
  previewMap: Record<string, string>;
}

export function ReferenceLink({
  href,
  children,
  previewMap,
}: ReferenceLinkProps) {
  if (href?.startsWith("/dice/")) {
    const diceText = decodeURIComponent(href.slice(6));
    return <DiceNotation text={diceText} />;
  }
  if (href?.startsWith("/reference/")) {
    const term = String(children).toLowerCase();
    const preview = previewMap[term];
    if (preview) {
      return (
        <HoverCard openDelay={300} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Link href={href} className="reference-link">
              {children}
            </Link>
          </HoverCardTrigger>
          <HoverCardContent side="top" className="w-80 text-sm">
            <ReactMarkdown
              components={{
                p: ({ children: pChildren }) => (
                  <p className="text-sm">{pChildren}</p>
                ),
              }}
            >
              {preview}
            </ReactMarkdown>
          </HoverCardContent>
        </HoverCard>
      );
    }
    return <Link href={href}>{children}</Link>;
  }
  if (href?.startsWith("/spell-schools/")) {
    return (
      <Link
        href={href}
        className="inline-flex items-baseline gap-0.5 hover:underline"
      >
        <WandSparkles className="stroke-flame size-3.5" />
        <span>{children}</span>
      </Link>
    );
  }
  if (href?.startsWith("/")) {
    return <Link href={href}>{children}</Link>;
  }
  return <a href={href}>{String(children)}</a>;
}
