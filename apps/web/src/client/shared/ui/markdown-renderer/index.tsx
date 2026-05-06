"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/shared/lib";

interface MarkdownRendererProps {
  markdown: string;
  className?: string;
}

/** Read-mode markdown renderer.
 *
 * Wraps `react-markdown` (with GFM for tables / strikethrough / task lists)
 * in Tailwind's `prose` utility so headings scale, blockquotes pick up a
 * left rule, lists indent, code goes monospace — i.e. document styling
 * rather than editor styling. `dark:prose-invert` flips the palette in
 * dark mode without us maintaining two stylesheets. */
export function MarkdownRenderer({ markdown, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
