"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useTRPC } from "@/shared/api/trpc/client";
import { REFERENCE_KIND_LABELS, type ReferenceKind } from "@/kernel/reference";
import { Button } from "@/shared/ui/button";

interface ReferencesPanelProps {
  productId: string;
  prdId: string;
}

interface ImportOption {
  kind: ReferenceKind;
  id: string;
  label: string;
}

/** A PRD's imports — the inner-ring concepts (benefits, personas, principles)
 * this spec is written against. The forward edges shown here are exactly the
 * backlinks surfaced on each of those concepts. */
export function ReferencesPanel({ productId, prdId }: ReferencesPanelProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const sourceArgs = { productId, sourceKind: "prd" as const, sourceId: prdId };
  const refsQuery = useQuery(trpc.reference.listBySource.queryOptions(sourceArgs));
  const benefitsQuery = useQuery(trpc.product.benefit.list.queryOptions({ productId }));
  const personasQuery = useQuery(trpc.product.persona.list.queryOptions({ productId }));
  const policiesQuery = useQuery(trpc.policy.list.queryOptions({ productId }));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.reference.listBySource.queryKey(sourceArgs) });
  const addMutation = useMutation(trpc.reference.add.mutationOptions({ onSuccess: invalidate }));
  const removeMutation = useMutation(trpc.reference.remove.mutationOptions({ onSuccess: invalidate }));

  const labelOf = (kind: ReferenceKind, id: string): string | undefined => {
    if (kind === "benefit") return benefitsQuery.data?.find((b) => b.id === id)?.label;
    if (kind === "persona") return personasQuery.data?.find((p) => p.id === id)?.label;
    if (kind === "policy") return policiesQuery.data?.find((p) => p.id === id)?.title;
    return undefined;
  };

  const refs = refsQuery.data ?? [];
  const referenced = new Set(refs.map((r) => `${r.targetKind}:${r.targetId}`));

  /* Importable targets = every inner-ring concept not already imported. */
  const allOptions: ImportOption[] = [
    ...(benefitsQuery.data ?? []).map((b) => ({ kind: "benefit" as const, id: b.id, label: b.label })),
    ...(personasQuery.data ?? []).map((p) => ({ kind: "persona" as const, id: p.id, label: p.label })),
    ...(policiesQuery.data ?? []).map((p) => ({ kind: "policy" as const, id: p.id, label: p.title })),
  ].filter((o) => !referenced.has(`${o.kind}:${o.id}`));

  const IMPORT_KINDS: readonly ReferenceKind[] = ["benefit", "persona", "policy"];
  const groups = IMPORT_KINDS.map((kind) => ({
    kind,
    options: allOptions.filter((o) => o.kind === kind),
  }));

  const [selectValue, setSelectValue] = useState("");
  const onPick = (value: string) => {
    setSelectValue("");
    if (!value) return;
    const [kind, id] = value.split(":") as [ReferenceKind, string];
    addMutation.mutate({ ...sourceArgs, targetKind: kind, targetId: id });
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold">Imports</h2>
        <p className="text-xs text-muted-foreground">
          이 PRD가 따르는 상위 개념(혜택·페르소나·원칙). 코드처럼 안쪽 링만 import합니다.
        </p>
      </div>

      {refs.length === 0 ? (
        <p className="text-xs text-muted-foreground">아직 import한 개념이 없습니다.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {refs.map((r) => {
            const label = labelOf(r.targetKind, r.targetId);
            return (
              <li
                key={r.id}
                className="inline-flex items-center gap-1.5 rounded-full border bg-background py-1 pr-1 pl-2.5 text-xs"
              >
                <span className="text-muted-foreground">{REFERENCE_KIND_LABELS[r.targetKind]}</span>
                <span className={label ? "font-medium" : "font-medium text-destructive"}>
                  {label ?? "(removed)"}
                </span>
                <button
                  type="button"
                  aria-label="Remove import"
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => removeMutation.mutate({ id: r.id })}
                >
                  <X className="size-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <select
        value={selectValue}
        onChange={(e) => onPick(e.target.value)}
        disabled={addMutation.isPending}
        className="h-9 self-start rounded-md bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <option value="">+ Import a concept…</option>
        {groups.map((g) =>
          g.options.length > 0 ? (
            <optgroup key={g.kind} label={REFERENCE_KIND_LABELS[g.kind]}>
              {g.options.map((o) => (
                <option key={`${o.kind}:${o.id}`} value={`${o.kind}:${o.id}`}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : null,
        )}
      </select>

      {addMutation.error && (
        <span className="text-xs text-destructive">{addMutation.error.message}</span>
      )}
    </div>
  );
}
