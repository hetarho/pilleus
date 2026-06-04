import { notFound } from "next/navigation";
import { isProductSectionId } from "@/entities/product";
import { BenefitView } from "./sections/benefit-view";
import { DesignView } from "./sections/design-view";
import { MissionView } from "./sections/mission-view";
import { PersonaView } from "./sections/persona-view";
import { PrincipleView } from "./sections/principle-view";
import { PrdListView } from "./sections/prd-list-view";
import { SectionPlaceholder } from "./sections/section-placeholder";

interface ProductSectionViewProps {
  productId: string;
  sectionId: string;
}

export function ProductSectionView({ productId, sectionId }: ProductSectionViewProps) {
  if (!isProductSectionId(sectionId)) notFound();

  switch (sectionId) {
    /* Intent ring, by artifact: mission (the why), persona (the who),
     * benefit (the value). */
    case "mission":
      return <MissionView productId={productId} />;
    case "persona":
      return <PersonaView productId={productId} />;
    case "benefit":
      return <BenefitView productId={productId} />;
    case "prd":
      return <PrdListView productId={productId} />;
    /* Principles ring, by subject. The Design subject also surfaces the
     * Design System (tokens) below its prose principles. */
    case "design":
      return <DesignView productId={productId} />;
    case "product":
    case "ux":
    case "etc":
      return <PrincipleView productId={productId} category={sectionId} />;
    default:
      return <SectionPlaceholder productId={productId} sectionId={sectionId} />;
  }
}
