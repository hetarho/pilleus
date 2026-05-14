"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTRPC } from "@/shared/api/trpc/client";
import { Button } from "@/shared/ui/button";

interface CopyPromptButtonProps {
  prdId: string;
}

/**
 * Copy the LLM completion prompt for a PRD to the clipboard.
 *
 * Prompt construction lives entirely on the server (see
 * `prdCompletionTask` + `BuildPrdCompletionPromptUseCase`). This button
 * just fetches the system/user pair on click and concatenates them for
 * pasting into an external LLM. When the server-side LLM provider lands
 * later, this whole feature can be swapped for a one-click "complete"
 * button without touching the backend.
 */
export function CopyPromptButton({ prdId }: CopyPromptButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Reset the "복사됨" badge after 2s. Effect (rather than setTimeout in
   * onClick) so unmount cancels the timer cleanly. */
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    setBusy(true);
    setError(null);
    try {
      const { system, user } = await queryClient.fetchQuery(
        trpc.product.prd.completion.buildPrompt.queryOptions({ id: prdId }),
      );
      await navigator.clipboard.writeText(`${system}\n\n${user}`);
      setCopied(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "프롬프트 생성에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" onClick={handleCopy} disabled={busy}>
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : copied ? (
          <Check className="size-4" />
        ) : (
          <Copy className="size-4" />
        )}
        {busy ? "준비 중..." : copied ? "복사됨" : "프롬프트 복사"}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
