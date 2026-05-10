"use client";

import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { cn } from "@/shared/lib";

interface MermaidBlockProps {
  code: string;
  className?: string;
}

let initialized = false;

/** Renders a single mermaid diagram. The markdown renderer swaps any
 * ```mermaid``` fenced block for this component. We render to SVG via
 * `mermaid.render` rather than `mermaid.run` so each diagram lives in a
 * scoped subtree (no global DOM scan), and we re-render on theme flips so
 * dark/light palettes stay in sync with the rest of the document. */
export function MermaidBlock({ code, className }: MermaidBlockProps) {
  const { resolvedTheme } = useTheme();
  const reactId = useId();
  const safeId = `mermaid-${reactId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const isDark = resolvedTheme === "dark";

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
      securityLevel: "strict",
      fontFamily: "inherit",
    });
    initialized = true;

    mermaid
      .render(safeId, code)
      .then(({ svg }) => {
        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [code, resolvedTheme, safeId]);

  // Touch the flag so lint doesn't drop it; keeps a single init guard if we
  // later want to short-circuit re-initialization.
  void initialized;

  if (error) {
    return (
      <pre
        className={cn(
          "not-prose overflow-x-auto rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive",
          className,
        )}
      >
        Mermaid 렌더 실패: {error}
        {"\n\n"}
        {code}
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("not-prose my-4 flex justify-center overflow-x-auto", className)}
    />
  );
}
