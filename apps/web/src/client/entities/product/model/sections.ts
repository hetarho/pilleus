import {
  Boxes,
  Database,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ProductSectionId =
  | "overview"
  | "prd"
  | "policy"
  | "data"
  | "element"
  | "user-story";

export interface ProductSection {
  id: ProductSectionId;
  label: string;
  icon: LucideIcon;
}

export const PRODUCT_SECTIONS: readonly ProductSection[] = [
  { id: "overview",   label: "Overview",   icon: LayoutDashboard },
  { id: "prd",        label: "PRD",        icon: FileText },
  { id: "policy",     label: "Policy",     icon: ShieldCheck },
  { id: "data",       label: "Data",       icon: Database },
  { id: "element",    label: "Element",    icon: Boxes },
  { id: "user-story", label: "User Story", icon: Users },
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

export const DEFAULT_PRODUCT_SECTION: ProductSectionId = "overview";

export function productSectionHref(productId: string, sectionId: ProductSectionId): string {
  return `/dashboard/products/${productId}/${sectionId}`;
}
