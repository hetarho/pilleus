import {
  Boxes,
  FileText,
  Frame,
  Palette,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ProductSectionId =
  | "design"
  | "policy"
  | "element"
  | "user-story"
  | "wireframe"
  | "prd";

export interface ProductSection {
  id: ProductSectionId;
  label: string;
  icon: LucideIcon;
}

export const PRODUCT_SECTIONS: readonly ProductSection[] = [
  { id: "design",     label: "Design System", icon: Palette },
  { id: "policy",     label: "Policy",        icon: ShieldCheck },
  { id: "element",    label: "Element",       icon: Boxes },
  { id: "user-story", label: "User Story",    icon: Users },
  { id: "wireframe",  label: "Wireframe",     icon: Frame },
  { id: "prd",        label: "PRD",           icon: FileText },
] as const;

const VALID_IDS = new Set<ProductSectionId>(PRODUCT_SECTIONS.map((s) => s.id));

export function isProductSectionId(value: string): value is ProductSectionId {
  return VALID_IDS.has(value as ProductSectionId);
}

export function getProductSection(id: ProductSectionId): ProductSection {
  const section = PRODUCT_SECTIONS.find((s) => s.id === id);
  if (!section) throw new Error(`Unknown product section: ${id}`);
  return section;
}

export function productHref(productId: string): string {
  return `/dashboard/products/${productId}`;
}

export function productSectionHref(productId: string, sectionId: ProductSectionId): string {
  return `/dashboard/products/${productId}/${sectionId}`;
}
