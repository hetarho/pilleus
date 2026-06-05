"use client";

import { Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

interface MissionViewProps {
  productId: string;
}

/** Intent ring — Mission. The single scalar "why" at the product core. */
export function MissionView({ productId }: MissionViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));

  const [mission, setMission] = useState("");
  useEffect(() => {
    if (productQuery.data) setMission(productQuery.data.mission ?? "");
  }, [productQuery.data]);

  const update = useMutation(
    trpc.product.setMission.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.product.get.queryKey({ id: productId }) });
        queryClient.invalidateQueries({ queryKey: trpc.product.list.queryKey() });
      },
    }),
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <header className="flex items-center gap-3">
        <Target className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Mission</h1>
          {productQuery.data && (
            <p className="text-sm text-muted-foreground">{productQuery.data.name}</p>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          이 제품이 세상에 있어야 할 이유. 길게 쓸 것 없이 한 문장이면 충분합니다.
        </p>
        <Textarea
          className="mt-1"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          placeholder="Help PMs and engineers ship the right thing the first time"
          rows={3}
        />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            disabled={update.isPending}
            onClick={() => update.mutate({ id: productId, mission: mission.trim() || null })}
          >
            {update.isPending ? "Saving..." : "Save"}
          </Button>
          {update.isSuccess && <span className="text-sm text-muted-foreground">Saved.</span>}
          {update.error && (
            <span className="text-sm text-destructive">{update.error.message}</span>
          )}
        </div>
      </div>
    </main>
  );
}
