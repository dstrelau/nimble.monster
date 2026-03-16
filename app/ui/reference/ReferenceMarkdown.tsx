import { Link as LinkIcon } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { AdvantageDisadvantageExamples } from "@/app/reference/[slug]/AdvantageDisadvantageExamples";
import { HashHighlight } from "./HashHighlight";
import { ReferenceLink } from "./ReferenceLink";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function Heading({
  level,
  children,
}: {
  level: number;
  children: React.ReactNode;
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  const text = String(children);
  const id = slugify(text);
  return (
    <HashHighlight id={id}>
      <Tag id={id} className="group">
        {children}
        <a
          href={`#${id}`}
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity inline-block align-middle"
          aria-label={`Link to ${text}`}
        >
          <LinkIcon className="size-4 text-muted-foreground" />
        </a>
      </Tag>
    </HashHighlight>
  );
}

interface ReferenceMarkdownProps {
  content: string;
  previewMap: Record<string, string>;
}

export function ReferenceMarkdown({
  content,
  previewMap,
}: ReferenceMarkdownProps) {
  return (
    <MDXRemote
      source={content}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
        },
      }}
      components={{
        h1: ({ children }) => <Heading level={1}>{children}</Heading>,
        h2: ({ children }) => <Heading level={2}>{children}</Heading>,
        h3: ({ children }) => <Heading level={3}>{children}</Heading>,
        h4: ({ children }) => <Heading level={4}>{children}</Heading>,
        h5: ({ children }) => <Heading level={5}>{children}</Heading>,
        h6: ({ children }) => <Heading level={6}>{children}</Heading>,
        a: ({ href, children }) => (
          <ReferenceLink href={href} previewMap={previewMap}>
            {children}
          </ReferenceLink>
        ),
        AdvantageDisadvantageExamples,
      }}
    />
  );
}
