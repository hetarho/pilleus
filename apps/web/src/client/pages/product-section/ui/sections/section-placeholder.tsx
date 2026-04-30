"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { getProductSection, type ProductSectionId } from "@/entities/product";

interface SectionPlaceholderProps {
  productId: string;
  sectionId: ProductSectionId;
}

export function SectionPlaceholder({ productId, sectionId }: SectionPlaceholderProps) {
  const trpc = useTRPC();
  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));
  const section = getProductSection(sectionId);
  const Icon = section.icon;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center gap-3">
        <Icon className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">{section.label}</h1>
          {productQuery.data && (
            <p className="text-sm text-muted-foreground">{productQuery.data.name}</p>
          )}
        </div>
      </div>
      <div className="bg-card p-12 text-center text-sm text-muted-foreground">
        This section is not implemented yet.
      </div>
    </main>
  );
}
