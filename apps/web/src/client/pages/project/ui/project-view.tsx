"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import {
  useBenefitListQuery,
  usePersonaListQuery,
} from "@/entities/product";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

interface ProjectViewProps {
  productId: string;
}

export function ProjectView({ productId }: ProjectViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));

  const [description, setDescription] = useState("");
  const [mission, setMission] = useState("");

  useEffect(() => {
    const p = productQuery.data;
    if (!p) return;
    setDescription(p.description ?? "");
    setMission(p.mission ?? "");
  }, [productQuery.data]);

  const updateMutation = useMutation(
    trpc.product.updateOverview.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.product.get.queryKey({ id: productId }),
        });
        queryClient.invalidateQueries({ queryKey: trpc.product.list.queryKey() });
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: productId,
      description: description.trim() || null,
      mission: mission.trim() || null,
    });
  };

  if (productQuery.isPending) {
    return <p className="p-8 text-sm text-muted-foreground">Loading...</p>;
  }
  if (!productQuery.data) {
    return <p className="p-8 text-sm text-muted-foreground">Product not found.</p>;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-8">
      <header>
        <h1 className="text-2xl font-bold">{productQuery.data.name}</h1>
        <p className="text-sm text-muted-foreground">
          Intent — 이 product의 본질(왜·누구를 위해·무엇을). 사이드바의 다른 링은 이 정보를 참고합니다.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <FieldGroup label="Description" hint="What this product is in one or two sentences.">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="An AI-assisted product spec workspace for PMs and engineers."
            rows={2}
          />
        </FieldGroup>

        <FieldGroup label="Mission" hint="The single biggest goal — why this product exists.">
          <Textarea
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            placeholder="Help PMs and engineers ship the right thing the first time"
            rows={2}
          />
        </FieldGroup>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
          {updateMutation.isSuccess && (
            <span className="text-sm text-muted-foreground">Saved.</span>
          )}
          {updateMutation.error && (
            <span className="text-sm text-destructive">{updateMutation.error.message}</span>
          )}
        </div>
      </form>

      <PersonaSection productId={productId} />
      <BenefitSection productId={productId} />
    </main>
  );
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-base font-semibold">{label}</Label>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

function PersonaSection({ productId }: { productId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const personasQuery = usePersonaListQuery(productId);
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.product.persona.list.queryKey({ productId }) });

  const create = useMutation(trpc.product.persona.create.mutationOptions({ onSuccess: invalidate }));
  const update = useMutation(trpc.product.persona.update.mutationOptions({ onSuccess: invalidate }));
  const remove = useMutation(trpc.product.persona.delete.mutationOptions({ onSuccess: invalidate }));

  return (
    <FieldGroup label="Personas" hint="누구를 위해 만드는가. PRD가 이 목록을 import해 시나리오를 작성합니다.">
      <RowListEditor
        items={personasQuery.data ?? []}
        placeholder="A persona (e.g. 신규 PM)"
        onAdd={(label) => create.mutate({ productId, label })}
        onUpdate={(id, label) => update.mutate({ id, label })}
        onDelete={(id) => remove.mutate({ id })}
      />
    </FieldGroup>
  );
}

function BenefitSection({ productId }: { productId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const benefitsQuery = useBenefitListQuery(productId);
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.product.benefit.list.queryKey({ productId }) });

  const create = useMutation(trpc.product.benefit.create.mutationOptions({ onSuccess: invalidate }));
  const update = useMutation(trpc.product.benefit.update.mutationOptions({ onSuccess: invalidate }));
  const remove = useMutation(trpc.product.benefit.delete.mutationOptions({ onSuccess: invalidate }));

  return (
    <FieldGroup label="Benefits" hint="그들에게 어떤 이득을 제공하는가. PRD가 정확히 하나의 benefit을 import합니다.">
      <RowListEditor
        items={benefitsQuery.data ?? []}
        placeholder="A benefit"
        onAdd={(label) => create.mutate({ productId, label })}
        onUpdate={(id, label) => update.mutate({ id, label })}
        onDelete={(id) => remove.mutate({ id })}
      />
    </FieldGroup>
  );
}

interface RowItem {
  id: string;
  label: string;
}

/** Inline CRUD list backed by real rows: add via the bottom input, edit a row
 * by blurring after a change, delete with the X. */
function RowListEditor({
  items,
  placeholder,
  onAdd,
  onUpdate,
  onDelete,
}: {
  items: RowItem[];
  placeholder: string;
  onAdd: (label: string) => void;
  onUpdate: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <EditableRow
          key={item.id}
          item={item}
          placeholder={placeholder}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" size="sm" onClick={add} className="shrink-0">
          <Plus className="size-4" /> Add
        </Button>
      </div>
    </div>
  );
}

function EditableRow({
  item,
  placeholder,
  onUpdate,
  onDelete,
}: {
  item: RowItem;
  placeholder: string;
  onUpdate: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}) {
  const [value, setValue] = useState(item.label);
  useEffect(() => setValue(item.label), [item.label]);

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          const v = value.trim();
          if (v && v !== item.label) onUpdate(item.id, v);
          else if (!v) setValue(item.label);
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDelete(item.id)}
        aria-label="Remove item"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
