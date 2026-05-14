"use client";

import { notFound } from "next/navigation";
import { isProductSectionId, type ProductSectionId } from "@/entities/product";
import { DesignView } from "./sections/design-view";
import { PrdListView } from "./sections/prd-list-view";
import { SectionPlaceholder } from "./sections/section-placeholder";

interface ProductSectionViewProps {
  productId: string;
  sectionId: string;
}

export function ProductSectionView({ productId, sectionId }: ProductSectionViewProps) {
  if (!isProductSectionId(sectionId)) notFound();
  const id = sectionId as ProductSectionId;

  switch (id) {
    case "prd":
      return <PrdListView productId={productId} />;
    case "design":
      return <DesignView productId={productId} />;
    default:
      return <SectionPlaceholder productId={productId} sectionId={id} />;
  }
}
