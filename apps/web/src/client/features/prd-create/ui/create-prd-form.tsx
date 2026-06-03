"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

interface CreatePrdFormProps {
  productId: string;
  onSuccess?: (prdId: string) => void;
}

export function CreatePrdForm({ productId, onSuccess }: CreatePrdFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  /** "" means "no benefit linked"; otherwise the benefit's id */
  const [benefitChoice, setBenefitChoice] = useState<string>("");

  const createMutation = useMutation(
    trpc.product.prd.create.mutationOptions({
      onSuccess: (prd) => {
        queryClient.invalidateQueries({
          queryKey: trpc.product.prd.list.queryKey({ productId }),
        });
        setTitle("");
        setBenefitChoice("");
        onSuccess?.(prd.id);
      },
    }),
  );

  const benefitsQuery = useQuery(trpc.product.benefit.list.queryOptions({ productId }));
  const benefits = benefitsQuery.data ?? [];

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        createMutation.mutate({
          productId,
          title,
          benefitId: benefitChoice === "" ? null : benefitChoice,
        });
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="prd-title">Title</Label>
        <Input
          id="prd-title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What is this PRD about?"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="prd-benefit">Benefit (optional)</Label>
        <p className="text-xs text-muted-foreground">
          Which product benefit does this PRD serve?
        </p>
        <select
          id="prd-benefit"
          value={benefitChoice}
          onChange={(e) => setBenefitChoice(e.target.value)}
          className="h-9 rounded-md bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">— none —</option>
          {benefits.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={createMutation.isPending || !title.trim()}>
        {createMutation.isPending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
