"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { generateClientShades } from "@/entities/palette";
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

interface PaletteEditDialogProps {
  productId: string;
  trigger: ReactNode;
  /** When provided, dialog runs in edit mode for this palette. */
  palette?: { id: string; name: string; seedHex: string };
}

/** Single dialog handling both create and edit. Splitting them out felt
 * premature given the form is identical and the only divergence is which
 * mutation runs on submit. */
export function PaletteEditDialog({ productId, trigger, palette }: PaletteEditDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = palette !== undefined;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(palette?.name ?? "");
  const [seedHex, setSeedHex] = useState(palette?.seedHex ?? "#4f46e5");

  /* Re-hydrate when the dialog reopens — without this, editing palette A
   * then opening the same dialog for palette B keeps A's values. */
  useEffect(() => {
    if (open) {
      setName(palette?.name ?? "");
      setSeedHex(palette?.seedHex ?? "#4f46e5");
    }
  }, [open, palette]);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.design.palette.list.queryKey({ productId }),
    });

  const createMutation = useMutation(
    trpc.design.palette.create.mutationOptions({
      onSuccess: () => {
        invalidate();
        setOpen(false);
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.design.palette.update.mutationOptions({
      onSuccess: () => {
        invalidate();
        setOpen(false);
      },
    }),
  );

  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSubmit = name.trim().length > 0 && /^#[0-9a-fA-F]{6}$/.test(seedHex) && !isPending;

  const previewShades = (() => {
    try {
      return generateClientShades(seedHex);
    } catch {
      return null;
    }
  })();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit palette" : "New palette"}</DialogTitle>
          <DialogDescription>
            Pick a seed color. The 50–950 ramp is generated automatically in OKLCH.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            if (isEdit && palette) {
              updateMutation.mutate({ id: palette.id, name, seedHex });
            } else {
              createMutation.mutate({ productId, name, seedHex });
            }
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="palette-name">Name</Label>
            <Input
              id="palette-name"
              autoFocus
              placeholder="red, brand, neutral, ..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="palette-seed">Seed color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={seedHex}
                onChange={(e) => setSeedHex(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
                aria-label="Seed color picker"
              />
              <Input
                id="palette-seed"
                value={seedHex}
                onChange={(e) => setSeedHex(e.target.value)}
                placeholder="#4f46e5"
                className="font-mono"
              />
            </div>
          </div>
          {previewShades && (
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <div className="flex h-8 overflow-hidden rounded">
                {previewShades.map((s) => (
                  <div
                    key={s.step}
                    className="flex-1"
                    style={{ backgroundColor: s.hex }}
                    title={`${s.step} · ${s.hex}`}
                  />
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {isPending ? "Saving..." : isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
