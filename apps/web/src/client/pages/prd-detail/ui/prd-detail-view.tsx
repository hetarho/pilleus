"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useTRPC } from "@/shared/api/trpc/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { MarkdownEditor } from "@/shared/ui/markdown-editor";
import { MarkdownRenderer } from "@/shared/ui/markdown-renderer";
import { cn } from "@/shared/lib";
import { productSectionHref } from "@/entities/product";
import { CopyPromptButton } from "@/features/prd-prompt-copy";
import { PrdFormView } from "@/features/prd-form-view";
import { PublishDialog } from "@/features/prd-publish";
import { HistoryPanel } from "@/features/prd-history";

type PrdStatus = "draft" | "published" | "ai_reviewed";

const STATUS_LABEL: Record<PrdStatus, string> = {
  draft: "초안",
  published: "발행",
  ai_reviewed: "AI 리뷰",
};

interface PrdDetailViewProps {
  productId: string;
  prdId: string;
}

export function PrdDetailView({ productId, prdId }: PrdDetailViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));
  const prdQuery = useQuery(trpc.product.prd.get.queryOptions({ id: prdId }));

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [benefitChoice, setBenefitChoice] = useState<string>("");
  const [status, setStatus] = useState<PrdStatus>("draft");
  /* Published mode shows a read-only render by default; user clicks 수정
   * to switch into the editable MarkdownEditor and 완료 to return. */
  const [isEditing, setIsEditing] = useState(false);
  /* Bumped on version restore so PrdFormView remounts and re-derives its
   * answers from the restored content (it only parses `content` on mount). */
  const [formResetKey, setFormResetKey] = useState(0);

  /* Server is the source of truth; mirror to local state on first load and
   * after every save/publish (invalidate is invoked by those only). This
   * deliberately does NOT touch isEditing — that's local UI state, and
   * resetting it on a save refetch would kick the user out of edit mode. */
  useEffect(() => {
    const p = prdQuery.data;
    if (!p) return;
    setTitle(p.title);
    setContent(p.content);
    setBenefitChoice(p.benefitIndex == null ? "" : String(p.benefitIndex));
    setStatus(p.status);
  }, [prdQuery.data]);

  /* Return to read mode only when navigating to a different PRD. */
  useEffect(() => {
    setIsEditing(false);
  }, [prdId]);

  const updateMutation = useMutation(
    trpc.product.prd.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.product.prd.get.queryKey({ id: prdId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.product.prd.list.queryKey({ productId }),
        });
      },
    }),
  );

  const product = productQuery.data;
  const benefits = product?.benefits ?? [];

  const handleSave = () => {
    updateMutation.mutate({
      id: prdId,
      title: title.trim() || undefined,
      benefitIndex: benefitChoice === "" ? null : Number(benefitChoice),
      content,
      status,
    });
  };

  if (prdQuery.isPending) {
    return <p className="p-8 text-sm text-muted-foreground">Loading...</p>;
  }
  if (!prdQuery.data) {
    return <p className="p-8 text-sm text-muted-foreground">PRD not found.</p>;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <Link
          href={productSectionHref(productId, "prd")}
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to PRDs
        </Link>

        <div className="flex items-center gap-3">
          <HistoryPanel
            prdId={prdId}
            currentContent={content}
            onRestore={(restored) => {
              setContent(restored);
              setFormResetKey((k) => k + 1);
            }}
          />
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="prd-title">Title</Label>
        <Input
          id="prd-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="PRD title"
          className="text-lg"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="prd-benefit">Benefit (optional)</Label>
        <select
          id="prd-benefit"
          value={benefitChoice}
          onChange={(e) => setBenefitChoice(e.target.value)}
          className="h-9 self-start rounded-md bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">— none —</option>
          {benefits.map((b, i) => (
            <option key={i} value={i}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* View driven entirely by status. Author can't toggle. */}
      {content && status === "draft" && (
        <PrdFormView key={formResetKey} content={content} onChange={setContent} />
      )}
      {content && status === "published" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing((v) => !v)}
            >
              {isEditing ? "완료" : "수정"}
            </Button>
          </div>
          {isEditing ? (
            <div className="bg-card p-8">
              <MarkdownEditor markdown={content} onChange={setContent} />
            </div>
          ) : (
            <div className="bg-card p-8">
              <MarkdownRenderer markdown={content} />
            </div>
          )}
        </div>
      )}
      {content && status === "ai_reviewed" && (
        <div className="rounded-lg bg-card p-8 text-sm text-muted-foreground">
          AI 리뷰 뷰는 MCP 연동 후 활성화 예정입니다.
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>

        {status === "draft" && (
          <PublishDialog prdId={prdId} productId={productId} />
        )}

        <CopyPromptButton prdId={prdId} />

        {updateMutation.isSuccess && (
          <span className="text-sm text-muted-foreground">Saved.</span>
        )}
        {updateMutation.error && (
          <span className="text-sm text-destructive">{updateMutation.error.message}</span>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: PrdStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        status === "draft" && "bg-muted text-muted-foreground",
        status === "published" && "bg-primary/15 text-primary",
        status === "ai_reviewed" && "bg-accent text-accent-foreground",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
