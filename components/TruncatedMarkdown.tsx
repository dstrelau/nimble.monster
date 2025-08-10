"use client";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface TruncatedMarkdownProps {
  content: string;
  truncationLength?: number;
  title: string;
  className?: string;
}

export function TruncatedMarkdown({
  content,
  truncationLength = 500,
  title,
  className = "prose prose-sm prose-neutral dark:prose-invert max-w-none",
}: TruncatedMarkdownProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const shouldTruncate = content.length > truncationLength;
  const truncatedContent = shouldTruncate
    ? `${content.substring(0, truncationLength)}...`
    : content;

  const truncatedHtml = DOMPurify.sanitize(
    marked(truncatedContent, { async: false }) as string
  );

  return (
    <div className={className}>
      <div
        className="inline [&>*:last-child]:inline"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized markdown content
        dangerouslySetInnerHTML={{ __html: truncatedHtml }}
      />
      {shouldTruncate && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="link"
              className="text-sm p-0 h-auto ml-1 align-baseline"
            >
              Read All
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-2xl overflow-y-scroll">
            <SheetHeader className="sr-only">
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <MarkdownRenderer
              content={content}
              className="w-full p-4 prose prose-sm prose-neutral dark:prose-invert max-w-none"
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
