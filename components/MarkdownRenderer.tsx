import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const html = DOMPurify.sanitize(String(marked(content)));

  return (
    <div
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized markdown content
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
