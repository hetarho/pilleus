"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useTRPC } from "@/shared/api/trpc/client";
import {
  DESIGN_POLICY_SECTIONS,
  POLICY_CATEGORY_LABELS,
  UX_POLICY_SECTIONS,
  type Policy,
  type PolicyCategory,
  type PolicySection,
} from "@/entities/policy";
import { PolicyEditDialog } from "@/features/policy-edit";
import { Button } from "@/shared/ui/button";

/** Subjects with named sections; others render as a flat list. */
function sectionsFor(category: PolicyCategory): readonly PolicySection[] {
  if (category === "design") return DESIGN_POLICY_SECTIONS;
  if (category === "ux") return UX_POLICY_SECTIONS;
  return [];
}

const SUBJECT_HINT: Record<PolicyCategory, string> = {
  product: "제품 전체가 따르는 비협상 원칙 — 무엇을 우선하고 무엇을 절대 하지 않는가.",
  design: "디자인 원칙 — 토큰으로는 표현할 수 없는 상위 디자인 가드레일.",
  ux: "UX 원칙 — 정보구조·폼·피드백·접근성 등 동작 차원의 규칙.",
  etc: "위 subject에 속하지 않는 product 고유의 원칙 — 인증, 데이터 보존, 권한 등.",
};

/** Renders one subject's principles (sectioned or flat). No page chrome — used
 * standalone via PrincipleView and embedded in the Design subject. */
export function PolicySections({
  productId,
  category,
}: {
  productId: string;
  category: PolicyCategory;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const policiesQuery = useQuery(trpc.policy.list.queryOptions({ productId }));
  const deleteMutation = useMutation(
    trpc.policy.delete.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: trpc.policy.list.queryKey({ productId }) }),
    }),
  );

  const policies = (policiesQuery.data ?? []).filter((p) => p.category === category);
  const sections = sectionsFor(category);
  const isPending = policiesQuery.isPending;
  const onDelete = (id: string) => deleteMutation.mutate({ id });

  if (sections.length === 0) {
    const sorted = [...policies].sort((a, b) => a.position - b.position);
    return (
      <PrincipleSection
        productId={productId}
        category={category}
        section={null}
        title={POLICY_CATEGORY_LABELS[category]}
        hint={SUBJECT_HINT[category]}
        policies={sorted}
        isPending={isPending}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => (
        <PrincipleSection
          key={section.id}
          productId={productId}
          category={category}
          section={section.id}
          title={section.label}
          hint={section.hint}
          policies={policies
            .filter((p) => p.section === section.id)
            .sort((a, b) => a.position - b.position)}
          isPending={isPending}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

/** Full-page view for a single principle subject (Product / UX / Etc). */
export function PrincipleView({
  productId,
  category,
}: {
  productId: string;
  category: PolicyCategory;
}) {
  const trpc = useTRPC();
  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">{POLICY_CATEGORY_LABELS[category]} 원칙</h1>
        {productQuery.data && (
          <p className="text-sm text-muted-foreground">{productQuery.data.name}</p>
        )}
      </header>
      <PolicySections productId={productId} category={category} />
    </main>
  );
}

interface PrincipleSectionProps {
  productId: string;
  category: PolicyCategory;
  section: string | null;
  title: string;
  hint: string;
  policies: Policy[];
  isPending: boolean;
  onDelete: (id: string) => void;
}

function PrincipleSection({
  productId,
  category,
  section,
  title,
  hint,
  policies,
  isPending,
  onDelete,
}: PrincipleSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <PolicyEditDialog
          productId={productId}
          category={category}
          section={section}
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="size-4" />
              Add
            </Button>
          }
        />
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : policies.length === 0 ? (
        <div className="rounded-md border border-dashed bg-card/30 p-6 text-center text-xs text-muted-foreground">
          아직 원칙이 없습니다.
        </div>
      ) : (
        <ul className="flex flex-col divide-y rounded-md border bg-card">
          {policies.map((p) => (
            <PrincipleRow
              key={p.id}
              productId={productId}
              category={category}
              policy={p}
              onDelete={() => onDelete(p.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function PrincipleRow({
  productId,
  category,
  policy,
  onDelete,
}: {
  productId: string;
  category: PolicyCategory;
  policy: Policy;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <PolicyEditDialog
        productId={productId}
        category={category}
        section={policy.section}
        policy={policy}
        trigger={
          <button
            type="button"
            className="flex flex-1 flex-col items-stretch gap-1 text-left hover:[&_.title]:underline"
          >
            <span className="title font-medium">{policy.title}</span>
            {policy.body && (
              <p className="line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">
                {policy.body}
              </p>
            )}
          </button>
        }
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={`Delete principle ${policy.title}`}
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(`Delete principle "${policy.title}"?`)) onDelete();
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
