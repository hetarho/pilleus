import { notFound } from "next/navigation";
import { isProductSectionId } from "@/entities/product";
import { DesignView } from "./sections/design-view";
import { PolicyView } from "./sections/policy-view";
import { PrdListView } from "./sections/prd-list-view";
import { SectionPlaceholder } from "./sections/section-placeholder";

interface ProductSectionViewProps {
  productId: string;
  sectionId: string;
}

export function ProductSectionView({ productId, sectionId }: ProductSectionViewProps) {
  if (!isProductSectionId(sectionId)) notFound();

  switch (sectionId) {
    case "prd":
      return <PrdListView productId={productId} />;
    case "design":
      return <DesignView productId={productId} />;
    case "policy":
      return <PolicyView productId={productId} />;
    default:
      return <SectionPlaceholder productId={productId} sectionId={sectionId} />;
  }
}
