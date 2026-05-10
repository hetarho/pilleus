"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/shared/lib";
import { MermaidBlock } from "./mermaid-block";

interface MarkdownRendererProps {
  markdown: string;
  className?: string;
}

/** `code` 블록 중 ```mermaid 펜스만 가로채서 다이어그램으로 렌더한다.
 * 그 외 언어는 react-markdown 기본 동작(`<code>` + prose 스타일)을 유지. */
const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const lang = match?.[1];
    const raw = String(children ?? "").replace(/\n$/, "");

    if (lang === "mermaid") {
      return <MermaidBlock code={raw} />;
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

/** Read-mode markdown renderer.
 *
 * Wraps `react-markdown` (with GFM for tables / strikethrough / task lists)
 * in Tailwind's `prose` utility so headings scale, blockquotes pick up a
 * left rule, lists indent, code goes monospace — i.e. document styling
 * rather than editor styling. `dark:prose-invert` flips the palette in
 * dark mode without us maintaining two stylesheets.
 *
 * `mermaid` 펜스 코드 블록은 `MermaidBlock`이 SVG로 렌더한다. */
export function MarkdownRenderer({ markdown, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
