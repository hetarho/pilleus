"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import {
  TOKEN_GROUPS,
  TOKEN_GROUP_HINTS,
  TOKEN_GROUP_LABELS,
  type TokenGroup,
} from "@/entities/design-token";
import { CopyDesignMdButton } from "@/features/design-md-copy/ui/copy-design-md-button";
import { DesignTokenEditDialog } from "@/features/design-token-edit/ui/design-token-edit-dialog";
import { PaletteEditDialog } from "@/features/palette-edit/ui/palette-edit-dialog";
import { TokenGenerationDialog } from "@/features/token-generation";
import { Button } from "@/shared/ui/button";

interface DesignViewProps {
  productId: string;
}

export function DesignView({ productId }: DesignViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));
  const palettesQuery = useQuery(trpc.design.palette.list.queryOptions({ productId }));
  const tokensQuery = useQuery(trpc.design.token.list.queryOptions({ productId }));

  const invalidatePalettes = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.design.palette.list.queryKey({ productId }),
    });
  const invalidateTokens = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.design.token.list.queryKey({ productId }),
    });

  const deletePaletteMutation = useMutation(
    trpc.design.palette.delete.mutationOptions({
      onSuccess: () => {
        invalidatePalettes();
        /* Color tokens reference palettes; deleting one nulls those refs in
         * the DB (FK ON DELETE SET NULL), so refresh the token list too so
         * broken refs surface immediately. */
        invalidateTokens();
      },
    }),
  );

  const deleteTokenMutation = useMutation(
    trpc.design.token.delete.mutationOptions({ onSuccess: invalidateTokens }),
  );

  const seedDefaultsMutation = useMutation(
    trpc.design.palette.seedDefaults.mutationOptions({ onSuccess: invalidatePalettes }),
  );

  const palettes = palettesQuery.data ?? [];
  const tokens = tokensQuery.data ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Design</h1>
          {productQuery.data && (
            <p className="text-sm text-muted-foreground">{productQuery.data.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TokenGenerationDialog productId={productId} />
          <CopyDesignMdButton
            productName={productQuery.data?.name ?? ""}
            palettes={palettes.map((p) => ({
              name: p.name,
              seedHex: p.seedHex,
              shades: p.shades,
            }))}
            tokens={tokens.map((t) => ({
              group: t.group,
              name: t.name,
              paletteName: t.paletteName,
              paletteStep: t.paletteStep,
              hex: t.hex,
              rawValue: t.rawValue,
            }))}
          />
        </div>
      </header>

      {/* ── Palettes ─────────────────────────────────────── */}
      <section className="mb-10 flex flex-col gap-3">
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
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed bg-card/50 p-12 text-center">
            <p className="text-sm text-muted-foreground">
              아직 팔레트가 없습니다. 빨강·파랑·neutral 같이 product에서 쓸 색상별로 하나씩 만들어보세요.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={seedDefaultsMutation.isPending}
              onClick={() => seedDefaultsMutation.mutate({ productId })}
            >
              <Sparkles className="size-4" />
              {seedDefaultsMutation.isPending
                ? "추가 중..."
                : "기본 팔레트로 시작 (brand / neutral / accent)"}
            </Button>
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
                        deletePaletteMutation.mutate({ id: p.id });
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

      {/* ── Token sections (one per group) ──────────────── */}
      {TOKEN_GROUPS.map((group) => {
        const inGroup = tokens.filter((t) => t.group === group);
        return (
          <section key={group} className="mb-10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{TOKEN_GROUP_LABELS[group]}</h2>
                <p className="text-xs text-muted-foreground">{TOKEN_GROUP_HINTS[group]}</p>
              </div>
              <div className="flex items-center gap-2">
                <TokenGenerationDialog productId={productId} group={group} />
                <DesignTokenEditDialog
                  productId={productId}
                  group={group}
                  palettes={palettes.map((p) => ({
                    id: p.id,
                    name: p.name,
                    shades: p.shades,
                  }))}
                  trigger={
                    <Button size="sm" variant="outline">
                      <Plus className="size-4" />
                      Add
                    </Button>
                  }
                />
              </div>
            </div>
            {tokensQuery.isPending ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : inGroup.length === 0 ? (
              <div className="rounded-md border border-dashed bg-card/30 p-6 text-center text-xs text-muted-foreground">
                아직 토큰이 없습니다.
              </div>
            ) : (
              <ul className="divide-y rounded-md border bg-card">
                {inGroup.map((t) => (
                  <TokenRow
                    key={t.id}
                    productId={productId}
                    group={group}
                    token={t}
                    palettes={palettes.map((p) => ({
                      id: p.id,
                      name: p.name,
                      shades: p.shades,
                    }))}
                    onDelete={() => {
                      if (confirm(`Delete token "${t.name}"?`)) {
                        deleteTokenMutation.mutate({ id: t.id });
                      }
                    }}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}

interface TokenRowProps {
  productId: string;
  group: TokenGroup;
  token: {
    id: string;
    name: string;
    paletteId: string | null;
    paletteStep: number | null;
    paletteName: string | null;
    hex: string | null;
    rawValue: string | null;
    description: string | null;
  };
  palettes: { id: string; name: string; shades: { step: number; hex: string }[] }[];
  onDelete: () => void;
}

function TokenRow({ productId, group, token, palettes, onDelete }: TokenRowProps) {
  const isColor = group === "color";
  const reference = isColor
    ? token.paletteName !== null && token.paletteStep !== null
      ? `${token.paletteName}.${token.paletteStep}`
      : "(broken)"
    : token.rawValue ?? "";

  return (
    <li className="flex items-start gap-3 px-4 py-2.5">
      <DesignTokenEditDialog
        productId={productId}
        group={group}
        palettes={palettes}
        token={token}
        trigger={
          <button
            type="button"
            className="flex flex-1 flex-col items-stretch gap-1 text-left hover:[&_.name]:underline"
          >
            <div className="flex items-center gap-3">
              <span className="name min-w-32 font-medium">{token.name}</span>
              {isColor && token.hex && (
                <span
                  className="size-5 shrink-0 rounded border"
                  style={{ backgroundColor: token.hex }}
                  aria-hidden
                />
              )}
              <span
                className={
                  "flex-1 truncate font-mono text-xs " +
                  (isColor && !token.hex
                    ? "text-destructive"
                    : "text-muted-foreground")
                }
              >
                {reference}
                {isColor && token.hex ? ` · ${token.hex}` : ""}
              </span>
            </div>
            {token.description && (
              <p className="text-xs text-muted-foreground">{token.description}</p>
            )}
          </button>
        }
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={`Delete token ${token.name}`}
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
