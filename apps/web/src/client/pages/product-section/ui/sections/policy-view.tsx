"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useTRPC } from "@/shared/api/trpc/client";
import {
  DESIGN_POLICY_SECTIONS,
  POLICY_CATEGORIES,
  POLICY_CATEGORY_LABELS,
  UX_POLICY_SECTIONS,
  type Policy,
  type PolicyCategory,
  type PolicySection,
} from "@/entities/policy";
import { PolicyEditDialog } from "@/features/policy-edit";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

interface PolicyViewProps {
  productId: string;
}

export function PolicyView({ productId }: PolicyViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));
  const policiesQuery = useQuery(trpc.policy.list.queryOptions({ productId }));

  const deleteMutation = useMutation(
    trpc.policy.delete.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.policy.list.queryKey({ productId }),
        }),
    }),
  );

  const policies = policiesQuery.data ?? [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">Policy</h1>
        {productQuery.data && (
          <p className="text-sm text-muted-foreground">{productQuery.data.name}</p>
        )}
      </header>

      <Tabs defaultValue="design">
        <TabsList>
          {POLICY_CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c}>
              {POLICY_CATEGORY_LABELS[c]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="design" className="mt-6">
          <SectionedTab
            productId={productId}
            category="design"
            sections={DESIGN_POLICY_SECTIONS}
            policies={policies.filter((p) => p.category === "design")}
            isPending={policiesQuery.isPending}
            onDelete={(id) => deleteMutation.mutate({ id })}
          />
        </TabsContent>

        <TabsContent value="ux" className="mt-6">
          <SectionedTab
            productId={productId}
            category="ux"
            sections={UX_POLICY_SECTIONS}
            policies={policies.filter((p) => p.category === "ux")}
            isPending={policiesQuery.isPending}
            onDelete={(id) => deleteMutation.mutate({ id })}
          />
        </TabsContent>

        <TabsContent value="etc" className="mt-6">
          <EtcTab
            productId={productId}
            policies={policies.filter((p) => p.category === "etc")}
            isPending={policiesQuery.isPending}
            onDelete={(id) => deleteMutation.mutate({ id })}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}

interface SectionedTabProps {
  productId: string;
  category: PolicyCategory;
  sections: readonly PolicySection[];
  policies: Policy[];
  isPending: boolean;
  onDelete: (id: string) => void;
}

function SectionedTab({
  productId,
  category,
  sections,
  policies,
  isPending,
  onDelete,
}: SectionedTabProps) {
  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => {
        const inSection = policies
          .filter((p) => p.section === section.id)
          .sort((a, b) => a.position - b.position);
        return (
          <section key={section.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{section.label}</h2>
                <p className="text-xs text-muted-foreground">{section.hint}</p>
              </div>
              <PolicyEditDialog
                productId={productId}
                category={category}
                section={section.id}
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
            ) : inSection.length === 0 ? (
              <div className="rounded-md border border-dashed bg-card/30 p-6 text-center text-xs text-muted-foreground">
                아직 정책이 없습니다.
              </div>
            ) : (
              <ul className="flex flex-col divide-y rounded-md border bg-card">
                {inSection.map((p) => (
                  <PolicyRow
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
      })}
    </div>
  );
}

interface EtcTabProps {
  productId: string;
  policies: Policy[];
  isPending: boolean;
  onDelete: (id: string) => void;
}

function EtcTab({ productId, policies, isPending, onDelete }: EtcTabProps) {
  const sorted = [...policies].sort((a, b) => a.position - b.position);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">기타 정책</h2>
          <p className="text-xs text-muted-foreground">
            디자인·UX 외 product 고유의 정책 — 인증, 데이터 보존, 결제, 권한 등.
          </p>
        </div>
        <PolicyEditDialog
          productId={productId}
          category="etc"
          section={null}
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
      ) : sorted.length === 0 ? (
        <div className="rounded-md border border-dashed bg-card/30 p-12 text-center text-sm text-muted-foreground">
          아직 정책이 없습니다.
        </div>
      ) : (
        <ul className="flex flex-col divide-y rounded-md border bg-card">
          {sorted.map((p) => (
            <PolicyRow
              key={p.id}
              productId={productId}
              category="etc"
              policy={p}
              onDelete={() => onDelete(p.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface PolicyRowProps {
  productId: string;
  category: PolicyCategory;
  policy: Policy;
  onDelete: () => void;
}

function PolicyRow({ productId, category, policy, onDelete }: PolicyRowProps) {
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
        aria-label={`Delete policy ${policy.title}`}
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(`Delete policy "${policy.title}"?`)) onDelete();
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
