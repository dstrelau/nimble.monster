import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownRenderer } from "./MarkdownRenderer";

describe("MarkdownRenderer", () => {
  describe("enabled features", () => {
    it("renders bold text", () => {
      const { container } = render(
        <MarkdownRenderer content="This is **bold** text" />
      );
      expect(container.innerHTML).toContain("<strong>bold</strong>");
    });

    it("renders italic text", () => {
      const { container } = render(
        <MarkdownRenderer content="This is *italic* text" />
      );
      expect(container.innerHTML).toContain("<em>italic</em>");
    });

    it("renders emphasis with underscores", () => {
      const { container } = render(
        <MarkdownRenderer content="This is __bold__ and _italic_ text" />
      );
      expect(container.innerHTML).toContain("<strong>bold</strong>");
      expect(container.innerHTML).toContain("<em>italic</em>");
    });

    it("handles paragraph separation", () => {
      const testContent = "Line one\n\n\nLine two";
      const { container } = render(<MarkdownRenderer content={testContent} />);
      const html = container.innerHTML;
      expect(html).toContain("<p>Line one</p>");
      expect(html).toContain("<p>Line two</p>");
    });

    it("renders bulleted lists", () => {
      const content = `- Item 1
- Item 2
- Item 3`;
      const { container } = render(<MarkdownRenderer content={content} />);
      expect(container.innerHTML).toContain("<ul>");
      expect(container.innerHTML).toContain("<li>Item 1</li>");
      expect(container.innerHTML).toContain("<li>Item 2</li>");
      expect(container.innerHTML).toContain("<li>Item 3</li>");
    });

    it("renders nested lists", () => {
      const content = `- Item 1
  - Nested item 1
  - Nested item 2
- Item 2`;
      const { container } = render(<MarkdownRenderer content={content} />);
      expect(container.innerHTML).toContain("<ul>");
      expect(container.innerHTML).toContain("</ul>");
      expect(container.innerHTML).toMatch(
        /<ul>[\s\S]*<ul>[\s\S]*<\/ul>[\s\S]*<\/ul>/
      );
    });
  });

  describe("disabled features", () => {
    it("does not render links", () => {
      const { container } = render(
        <MarkdownRenderer content="This is a [link](https://example.com)" />
      );
      expect(container.innerHTML).not.toContain("<a");
      expect(container.innerHTML).toContain("[link](https://example.com)");
    });

    it("does not process escape characters", () => {
      const { container } = render(
        <MarkdownRenderer content="This is \\*not bold\\*" />
      );
      expect(container.innerHTML).toContain("not bold");
      expect(container.innerHTML).toContain("<em>");
    });

    it("does not render tables", () => {
      const content = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;
      const { container } = render(<MarkdownRenderer content={content} />);
      expect(container.innerHTML).not.toContain("<table");
      expect(container.innerHTML).not.toContain("<th>");
      expect(container.innerHTML).not.toContain("<td>");
    });

    it("does not render headers", () => {
      const { container } = render(
        <MarkdownRenderer content="# This is a header" />
      );
      expect(container.innerHTML).not.toContain("<h1>");
      expect(container.innerHTML).toContain("# This is a header");
    });

    it("does not render code blocks", () => {
      const { container } = render(
        <MarkdownRenderer content="```\nconst x = 1;\n```" />
      );
      expect(container.innerHTML).not.toContain("<pre>");
      expect(container.innerHTML).not.toContain("<code>");
    });

    it("does not render inline code", () => {
      const { container } = render(
        <MarkdownRenderer content="This is `inline code`" />
      );
      expect(container.innerHTML).not.toContain("<code>");
      expect(container.innerHTML).toContain("`inline code`");
    });

    it("does not render blockquotes", () => {
      const { container } = render(
        <MarkdownRenderer content="> This is a blockquote" />
      );
      expect(container.innerHTML).not.toContain("<blockquote>");
      expect(container.innerHTML).toContain("&gt; This is a blockquote");
    });

    it("does not render horizontal rules", () => {
      const { container } = render(<MarkdownRenderer content="---" />);
      expect(container.innerHTML).not.toContain("<hr");
      expect(container.innerHTML).toContain("---");
    });
  });

  describe("HTML injection security", () => {
    it("sanitizes script tags", () => {
      const { container } = render(
        <MarkdownRenderer content="<script>alert('xss')</script>" />
      );
      expect(container.innerHTML).not.toContain("<script>");
      expect(container.innerHTML).toContain("&lt;script&gt;");
    });

    it("sanitizes onclick handlers", () => {
      const { container } = render(
        <MarkdownRenderer
          content={"<div onclick=\"alert('xss')\">Click me</div>"}
        />
      );
      expect(container.innerHTML).toContain("&lt;div");
      expect(container.innerHTML).toContain("&gt;");
      expect(container.innerHTML).not.toContain("<div onclick");
    });

    it("sanitizes javascript urls", () => {
      const { container } = render(
        <MarkdownRenderer
          content={"<a href=\"javascript:alert('xss')\">Link</a>"}
        />
      );
      expect(container.innerHTML).toContain("&lt;a href=");
      expect(container.innerHTML).not.toContain('<a href="javascript:');
    });

    it("sanitizes iframe tags", () => {
      const { container } = render(
        <MarkdownRenderer
          content={"<iframe src=\"javascript:alert('xss')\"></iframe>"}
        />
      );
      expect(container.innerHTML).not.toContain("<iframe>");
      expect(container.innerHTML).toContain("&lt;iframe");
    });

    it("sanitizes object and embed tags", () => {
      const { container } = render(
        <MarkdownRenderer
          content={"<object data=\"javascript:alert('xss')\"></object>"}
        />
      );
      expect(container.innerHTML).not.toContain("<object>");
      expect(container.innerHTML).toContain("&lt;object");
    });

    it("sanitizes style attributes with javascript", () => {
      const { container } = render(
        <MarkdownRenderer
          content={
            "<div style=\"background:url(javascript:alert('xss'))\">Content</div>"
          }
        />
      );
      expect(container.innerHTML).toContain("&lt;div");
      expect(container.innerHTML).not.toContain(
        '<div style="background:url(javascript:'
      );
    });

    it("escapes HTML tags in markdown", () => {
      const { container } = render(
        <MarkdownRenderer content="**Bold** text with <em>HTML</em>" />
      );
      expect(container.innerHTML).toContain("<strong>Bold</strong>");
      expect(container.innerHTML).toContain("&lt;em&gt;HTML&lt;/em&gt;");
    });

    it("sanitizes dangerous HTML while preserving markdown formatting", () => {
      const { container } = render(
        <MarkdownRenderer content="**Bold** <script>alert('xss')</script> *italic*" />
      );
      expect(container.innerHTML).toContain("<strong>Bold</strong>");
      expect(container.innerHTML).toContain("<em>italic</em>");
      expect(container.innerHTML).not.toContain("<script>");
      expect(container.innerHTML).toContain("&lt;script&gt;");
    });
  });

  describe("custom className", () => {
    it("applies custom className", () => {
      const { container } = render(
        <MarkdownRenderer content="Test" className="custom-class" />
      );
      expect(container.innerHTML).toContain('class="custom-class"');
    });

    it("applies empty className by default", () => {
      const { container } = render(<MarkdownRenderer content="Test" />);
      expect(container.innerHTML).toContain('class=""');
    });
  });
});
