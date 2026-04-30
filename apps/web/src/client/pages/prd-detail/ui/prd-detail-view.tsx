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
import { productSectionHref } from "@/entities/product";

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

  /* Server is the source of truth; mirror to local state on first load and
   * after every save. We don't sync on every server tick to avoid clobbering
   * unsaved edits — TanStack Query's invalidate is invoked by saves only. */
  useEffect(() => {
    const p = prdQuery.data;
    if (!p) return;
    setTitle(p.title);
    setContent(p.content);
    setBenefitChoice(p.benefitIndex == null ? "" : String(p.benefitIndex));
  }, [prdQuery.data]);

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

  const benefits = productQuery.data?.benefits ?? [];

  const handleSave = () => {
    updateMutation.mutate({
      id: prdId,
      title: title.trim() || undefined,
      benefitIndex: benefitChoice === "" ? null : Number(benefitChoice),
      content,
    });
  };

  if (prdQuery.isPending) {
    return <p className="p-8 text-sm text-muted-foreground">Loading...</p>;
  }
  if (!prdQuery.data) {
    return <p className="p-8 text-sm text-muted-foreground">PRD not found.</p>;
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={productSectionHref(productId, "prd")}
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to PRDs
        </Link>
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

      <div className="flex flex-col gap-2">
        <Label>Content</Label>
        <div className="bg-card">
          <MarkdownEditor markdown={content} onChange={setContent} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
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
