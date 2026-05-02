"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

interface OverviewViewProps {
  productId: string;
}

export function OverviewView({ productId }: OverviewViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));

  const [mission, setMission] = useState("");
  const [benefits, setBenefits] = useState<string[]>([""]);
  const [principles, setPrinciples] = useState<string[]>([""]);
  const [actors, setActors] = useState<string[]>([""]);

  /* Hydrate local state from server data when it arrives. The form is
   * uncontrolled-ish: server is the source of truth on initial load and
   * after each save; user edits drive local state until the next save. */
  useEffect(() => {
    const p = productQuery.data;
    if (!p) return;
    setMission(p.mission ?? "");
    setBenefits(p.benefits.length > 0 ? [...p.benefits] : [""]);
    setPrinciples(p.principles.length > 0 ? [...p.principles] : [""]);
    setActors(p.actors.length > 0 ? [...p.actors] : [""]);
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
      mission: mission.trim() || null,
      benefits: benefits.map((b) => b.trim()).filter(Boolean),
      principles: principles.map((p) => p.trim()).filter(Boolean),
      actors: actors.map((a) => a.trim()).filter(Boolean),
    });
  };

  if (productQuery.isPending) {
    return <p className="p-8 text-sm text-muted-foreground">Loading...</p>;
  }
  if (!productQuery.data) {
    return <p className="p-8 text-sm text-muted-foreground">Product not found.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <FieldGroup label="Mission" hint="The single biggest goal — why this product exists.">
        <Textarea
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          placeholder="Help PMs and engineers ship the right thing the first time"
          rows={2}
        />
      </FieldGroup>

      <FieldGroup
        label="Benefits"
        hint="Distinct value propositions the product delivers."
      >
        <ListEditor items={benefits} onChange={setBenefits} placeholder="A benefit" />
      </FieldGroup>

      <FieldGroup
        label="Principles"
        hint="Non-negotiable rules to follow while building this product."
      >
        <ListEditor items={principles} onChange={setPrinciples} placeholder="A principle" />
      </FieldGroup>

      <FieldGroup
        label="Actors"
        hint="Who or what interacts with this product (end user, admin, scheduler, ...). PRDs reference this list."
      >
        <ListEditor items={actors} onChange={setActors} placeholder="An actor" />
      </FieldGroup>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
        {updateMutation.isSuccess && (
          <span className="text-sm text-muted-foreground">Saved.</span>
        )}
        {updateMutation.error && (
          <span className="text-sm text-destructive">
            {updateMutation.error.message}
          </span>
        )}
      </div>
    </form>
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

function ListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const update = (i: number, value: string) => {
    const next = [...items];
    next[i] = value;
    onChange(next);
  };
  const remove = (i: number) => {
    const next = items.filter((_, idx) => idx !== i);
    onChange(next.length > 0 ? next : [""]);
  };
  const add = () => onChange([...items, ""]);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(i)}
            aria-label="Remove item"
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="self-start">
        <Plus className="size-4" /> Add
      </Button>
    </div>
  );
}
