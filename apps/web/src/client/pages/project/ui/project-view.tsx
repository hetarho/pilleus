"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { useStringList, type StringList } from "@/shared/lib/hooks/use-string-list";
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
  const benefits = useStringList();
  const principles = useStringList();
  const actors = useStringList();

  useEffect(() => {
    const p = productQuery.data;
    if (!p) return;
    setDescription(p.description ?? "");
    setMission(p.mission ?? "");
    benefits.reset(p.benefits);
    principles.reset(p.principles);
    actors.reset(p.actors);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset identities are stable; sync only on new server data
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
      benefits: benefits.values.map((b) => b.trim()).filter(Boolean),
      principles: principles.values.map((p) => p.trim()).filter(Boolean),
      actors: actors.values.map((a) => a.trim()).filter(Boolean),
    });
  };

  if (productQuery.isPending) {
    return <p className="p-8 text-sm text-muted-foreground">Loading...</p>;
  }
  if (!productQuery.data) {
    return <p className="p-8 text-sm text-muted-foreground">Product not found.</p>;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">{productQuery.data.name}</h1>
        <p className="text-sm text-muted-foreground">
          프로젝트 개요 — 사이드바의 각 섹션이 이 정보를 참고해 PRD·디자인 토큰 등을 만듭니다.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <FieldGroup
          label="Description"
          hint="What this product is in one or two sentences."
        >
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

        <FieldGroup
          label="Benefits"
          hint="Distinct value propositions the product delivers."
        >
          <ListEditor list={benefits} placeholder="A benefit" />
        </FieldGroup>

        <FieldGroup
          label="Principles"
          hint="Non-negotiable rules to follow while building this product."
        >
          <ListEditor list={principles} placeholder="A principle" />
        </FieldGroup>

        <FieldGroup
          label="Actors"
          hint="Who or what interacts with this product (end user, admin, scheduler, ...). PRDs reference this list."
        >
          <ListEditor list={actors} placeholder="An actor" />
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

function ListEditor({ list, placeholder }: { list: StringList; placeholder: string }) {
  return (
    <div className="flex flex-col gap-2">
      {list.rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <Input
            value={row.value}
            onChange={(e) => list.setValue(row.id, e.target.value)}
            placeholder={placeholder}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => list.remove(row.id)}
            aria-label="Remove item"
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={list.add} className="self-start">
        <Plus className="size-4" /> Add
      </Button>
    </div>
  );
}
