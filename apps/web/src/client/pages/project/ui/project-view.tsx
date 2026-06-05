"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

interface ProjectViewProps {
  productId: string;
}

/* Product Overview — the product root, above the rings. It owns the product's
 * identity (name + description). The planning-layer rings are rendered by the
 * workspace shell (the route layout) so they persist while editing a section;
 * here we only own identity. */
export function ProjectView({ productId }: ProjectViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));

  const [description, setDescription] = useState("");
  useEffect(() => {
    if (productQuery.data) setDescription(productQuery.data.description ?? "");
  }, [productQuery.data]);

  const updateDescription = useMutation(
    trpc.product.updateDescription.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.product.get.queryKey({ id: productId }) });
        queryClient.invalidateQueries({ queryKey: trpc.product.list.queryKey() });
      },
    }),
  );

  if (productQuery.isPending) {
    return <p className="p-8 text-sm text-muted-foreground">Loading...</p>;
  }
  if (!productQuery.data) {
    return <p className="p-8 text-sm text-muted-foreground">Product not found.</p>;
  }

  const product = productQuery.data;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-sm text-muted-foreground">
          이 제품을 이루는 네 겹의 기획. 가운데로 갈수록 뿌리에 가깝고, 바깥일수록 자주 바뀝니다.
        </p>
      </header>

      {/* Description is product identity (it sits above the rings), so it stays editable here. */}
      <section className="flex flex-col gap-2">
        <Label className="text-sm font-semibold">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="An AI-assisted product spec workspace for PMs and engineers."
          rows={2}
        />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            disabled={updateDescription.isPending}
            onClick={() =>
              updateDescription.mutate({ id: productId, description: description.trim() || null })
            }
          >
            {updateDescription.isPending ? "Saving..." : "Save"}
          </Button>
          {updateDescription.isSuccess && (
            <span className="text-sm text-muted-foreground">Saved.</span>
          )}
          {updateDescription.error && (
            <span className="text-sm text-destructive">{updateDescription.error.message}</span>
          )}
        </div>
      </section>
    </main>
  );
}
