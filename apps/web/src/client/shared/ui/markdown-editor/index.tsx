"use client";

import dynamic from "next/dynamic";

/* MDXEditor pulls in Lexical + a CodeMirror chunk; load only on the client
 * via dynamic import so the Markdown chunk doesn't bloat the SSR bundle. */
export const MarkdownEditor = dynamic(() => import("./markdown-editor.client"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] animate-pulse bg-muted" aria-hidden="true" />
  ),
});
