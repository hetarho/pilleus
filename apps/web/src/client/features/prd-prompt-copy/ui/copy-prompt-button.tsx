"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { buildPrdCompletionPrompt, type PrdCompletionContext } from "../lib/build-prompt";

interface CopyPromptButtonProps {
  /** Current PRD markdown body. */
  content: string;
  /** Parent product info + PRD title — surfaced as context at the top of
   * the wrapper prompt so the external LLM has full framing. */
  context: PrdCompletionContext;
}

export function CopyPromptButton({ content, context }: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false);

  /* Reset the "복사됨" badge after 2s. Effect (rather than setTimeout in
   * onClick) so unmount cancels the timer cleanly. */
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    const prompt = buildPrdCompletionPrompt(content, context);
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
  };

  return (
    <Button type="button" variant="outline" onClick={handleCopy}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "복사됨" : "프롬프트 복사"}
    </Button>
  );
}
