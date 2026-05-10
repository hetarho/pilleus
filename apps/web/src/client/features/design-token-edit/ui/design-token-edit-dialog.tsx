"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { SHADE_STEPS } from "@/entities/palette";
import {
  TOKEN_GROUP_LABELS,
  type TokenGroup,
} from "@/entities/design-token";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

interface PaletteOption {
  id: string;
  name: string;
  shades: { step: number; hex: string }[];
}

interface DesignTokenEditDialogProps {
  productId: string;
  group: TokenGroup;
  trigger: ReactNode;
  /** Palette options for color tokens. Required when group === "color"; the
   * caller normally just passes the full palette list. */
  palettes: PaletteOption[];
  /** Existing token — switches the dialog into edit mode. */
  token?: {
    id: string;
    name: string;
    paletteId: string | null;
    paletteStep: number | null;
    rawValue: string | null;
  };
}

/** One dialog handles every group + create/edit. The form fields differ by
 * group but the surrounding plumbing (open state, mutations, invalidation)
 * is the same, so collapsing them here avoids five near-identical files. */
export function DesignTokenEditDialog({
  productId,
  group,
  trigger,
  palettes,
  token,
}: DesignTokenEditDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = token !== undefined;
  const isColor = group === "color";

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [paletteId, setPaletteId] = useState("");
  const [paletteStep, setPaletteStep] = useState<number>(500);
  const [rawValue, setRawValue] = useState("");

  /* Hydrate when the dialog opens — without this, jumping from edit-A to
   * edit-B keeps A's values. */
  useEffect(() => {
    if (!open) return;
    setName(token?.name ?? "");
    if (isColor) {
      setPaletteId(token?.paletteId ?? palettes[0]?.id ?? "");
      setPaletteStep(token?.paletteStep ?? 500);
    } else {
      setRawValue(token?.rawValue ?? "");
    }
  }, [open, token, palettes, isColor]);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.design.token.list.queryKey({ productId }),
    });

  const createMutation = useMutation(
    trpc.design.token.create.mutationOptions({
      onSuccess: () => {
        invalidate();
        setOpen(false);
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.design.token.update.mutationOptions({
      onSuccess: () => {
        invalidate();
        setOpen(false);
      },
    }),
  );

  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSubmit = (() => {
    if (isPending) return false;
    if (name.trim().length === 0) return false;
    if (isColor) return paletteId !== "" && SHADE_STEPS.includes(paletteStep as 500);
    return rawValue.trim().length > 0;
  })();

  const previewHex = (() => {
    if (!isColor || !paletteId) return null;
    const p = palettes.find((x) => x.id === paletteId);
    return p?.shades.find((s) => s.step === paletteStep)?.hex ?? null;
  })();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit token" : `New ${TOKEN_GROUP_LABELS[group].toLowerCase()} token`}
          </DialogTitle>
          <DialogDescription>
            {isColor
              ? "팔레트의 step을 골라 의미별 별칭을 만듭니다."
              : "값을 자유롭게 입력하세요. 단위·문법은 CSS 그대로 들어갑니다."}
          </DialogDescription>
        </DialogHeader>

        {isColor && palettes.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            먼저 팔레트를 하나 이상 만들어주세요. 색상 토큰은 팔레트의 step을 가리킵니다.
          </p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;
              if (isEdit && token) {
                updateMutation.mutate(
                  isColor
                    ? { id: token.id, name, paletteId, paletteStep }
                    : { id: token.id, name, rawValue },
                );
              } else {
                createMutation.mutate(
                  isColor
                    ? { productId, group, name, paletteId, paletteStep }
                    : { productId, group, name, rawValue },
                );
              }
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="token-name">Name</Label>
              <Input
                id="token-name"
                autoFocus
                placeholder={
                  isColor ? "primary, surface, border, ..." : groupNamePlaceholder(group)
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {isColor ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="token-palette">Palette</Label>
                  <select
                    id="token-palette"
                    value={paletteId}
                    onChange={(e) => setPaletteId(e.target.value)}
                    className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    {palettes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="token-step">Step</Label>
                  <select
                    id="token-step"
                    value={paletteStep}
                    onChange={(e) => setPaletteStep(Number(e.target.value))}
                    className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    {SHADE_STEPS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                {previewHex && (
                  <div className="col-span-2 flex items-center gap-2">
                    <div
                      className="size-8 rounded border"
                      style={{ backgroundColor: previewHex }}
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {previewHex}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="token-value">Value</Label>
                <Input
                  id="token-value"
                  placeholder={groupValuePlaceholder(group)}
                  value={rawValue}
                  onChange={(e) => setRawValue(e.target.value)}
                  className="font-mono"
                />
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={!canSubmit}>
                {isPending ? "Saving..." : isEdit ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function groupNamePlaceholder(group: TokenGroup): string {
  switch (group) {
    case "typography":
      return "font-sans, text-base, weight-medium, ...";
    case "spacing":
      return "2, 4, 8, gutter, ...";
    case "radius":
      return "sm, md, lg, full, ...";
    case "shadow":
      return "sm, md, lg, ...";
    default:
      return "";
  }
}

function groupValuePlaceholder(group: TokenGroup): string {
  switch (group) {
    case "typography":
      return "Inter, ui-sans-serif, system-ui  /  16px / 24px";
    case "spacing":
      return "8px";
    case "radius":
      return "6px";
    case "shadow":
      return "0 1px 2px rgb(0 0 0 / 0.05)";
    default:
      return "";
  }
}
