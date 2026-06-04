"use client";

import { Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePersonaListQuery } from "@/entities/product";
import { useTRPC } from "@/shared/api/trpc/client";
import { RowListEditor } from "./row-list-editor";

interface PersonaViewProps {
  productId: string;
}

/** Intent ring — Persona. Who the product is for. PRDs import these. */
export function PersonaView({ productId }: PersonaViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));
  const personasQuery = usePersonaListQuery(productId);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.product.persona.list.queryKey({ productId }) });

  const create = useMutation(trpc.product.persona.create.mutationOptions({ onSuccess: invalidate }));
  const update = useMutation(trpc.product.persona.update.mutationOptions({ onSuccess: invalidate }));
  const remove = useMutation(trpc.product.persona.delete.mutationOptions({ onSuccess: invalidate }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <header className="flex items-center gap-3">
        <Users className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Persona</h1>
          {productQuery.data && (
            <p className="text-sm text-muted-foreground">{productQuery.data.name}</p>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          누구를 위해 만드는가. PRD가 이 목록을 import해 시나리오를 작성합니다.
        </p>
        <RowListEditor
          items={personasQuery.data ?? []}
          placeholder="A persona (e.g. 신규 PM)"
          onAdd={(label) => create.mutate({ productId, label })}
          onUpdate={(id, label) => update.mutate({ id, label })}
          onDelete={(id) => remove.mutate({ id })}
        />
      </div>
    </main>
  );
}
