"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { PaletteEditDialog } from "@/features/palette-edit/ui/palette-edit-dialog";
import { CopyDesignMdButton } from "@/features/design-md-copy/ui/copy-design-md-button";
import { Button } from "@/shared/ui/button";

interface DesignViewProps {
  productId: string;
}

export function DesignView({ productId }: DesignViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));
  const palettesQuery = useQuery(trpc.design.palette.list.queryOptions({ productId }));

  const deleteMutation = useMutation(
    trpc.design.palette.delete.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.design.palette.list.queryKey({ productId }),
        }),
    }),
  );

  const palettes = palettesQuery.data ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Design</h1>
          {productQuery.data && (
            <p className="text-sm text-muted-foreground">{productQuery.data.name}</p>
          )}
        </div>
        <CopyDesignMdButton
          productName={productQuery.data?.name ?? ""}
          palettes={palettes.map((p) => ({
            name: p.name,
            seedHex: p.seedHex,
            shades: p.shades,
          }))}
        />
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Palettes</h2>
          <PaletteEditDialog
            productId={productId}
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="size-4" />
                New palette
              </Button>
            }
          />
        </div>

        {palettesQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : palettes.length === 0 ? (
          <div className="rounded-md border border-dashed bg-card/50 p-12 text-center text-sm text-muted-foreground">
            아직 팔레트가 없습니다. 빨강·파랑·neutral 같이 product에서 쓸 색상별로 하나씩 만들어보세요.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {palettes.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-md border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <PaletteEditDialog
                    productId={productId}
                    palette={{ id: p.id, name: p.name, seedHex: p.seedHex }}
                    trigger={
                      <button
                        type="button"
                        className="flex items-baseline gap-2 text-left hover:underline"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {p.seedHex}
                        </span>
                      </button>
                    }
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete palette ${p.name}`}
                    onClick={() => {
                      if (confirm(`Delete palette "${p.name}"?`)) {
                        deleteMutation.mutate({ id: p.id });
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="flex h-10 overflow-hidden rounded">
                  {p.shades.map((s) => (
                    <div
                      key={s.step}
                      className="group relative flex-1"
                      style={{ backgroundColor: s.hex }}
                      title={`${s.step} · ${s.hex}`}
                    >
                      <span className="pointer-events-none absolute inset-x-0 bottom-0.5 text-center text-[10px] opacity-0 mix-blend-difference group-hover:opacity-100">
                        {s.step}
                      </span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
