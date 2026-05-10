"use client";

import { notFound } from "next/navigation";
import { isProductSectionId, type ProductSectionId } from "@/entities/product";
import { OverviewView } from "./sections/overview-view";
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
    case "overview":
      return <OverviewView productId={productId} />;
    case "prd":
      return <PrdListView productId={productId} />;
    default:
      // policy / design / ux / element / user-story — not yet implemented
      return <SectionPlaceholder productId={productId} sectionId={id} />;
  }
}
