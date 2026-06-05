"use client";

import { Gift } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBenefitListQuery } from "@/entities/product";
import { useTRPC } from "@/shared/api/trpc/client";
import { RowListEditor } from "./row-list-editor";

interface BenefitViewProps {
  productId: string;
}

/** Intent ring — Benefit. The value delivered. A PRD imports exactly one. */
export function BenefitView({ productId }: BenefitViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));
  const benefitsQuery = useBenefitListQuery(productId);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.product.benefit.list.queryKey({ productId }) });

  const create = useMutation(trpc.product.benefit.create.mutationOptions({ onSuccess: invalidate }));
  const update = useMutation(trpc.product.benefit.update.mutationOptions({ onSuccess: invalidate }));
  const remove = useMutation(trpc.product.benefit.delete.mutationOptions({ onSuccess: invalidate }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <header className="flex items-center gap-3">
        <Gift className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Benefit</h1>
          {productQuery.data && (
            <p className="text-sm text-muted-foreground">{productQuery.data.name}</p>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          사용자가 손에 쥐는 것. PRD 하나는 정확히 이 중 하나에 매달립니다.
        </p>
        <RowListEditor
          items={benefitsQuery.data ?? []}
          placeholder="A benefit"
          onAdd={(label) => create.mutate({ productId, label })}
          onUpdate={(id, label) => update.mutate({ id, label })}
          onDelete={(id) => remove.mutate({ id })}
        />
      </div>
    </main>
  );
}
