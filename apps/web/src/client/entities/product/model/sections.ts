import {
  Compass,
  FileText,
  Frame,
  LayoutDashboard,
  MousePointerClick,
  Palette,
  Shapes,
  Users,
  type LucideIcon,
} from "lucide-react";

/* A product is organized as four concentric rings (Clean Architecture for
 * planning): the most stable Intent at the core, the most volatile Surface at
 * the edge, dependencies pointing inward. The "Principles" ring is divided by
 * SUBJECT (what each principle is about) — never by abstraction tier. */
export type ProductSectionId =
  | "product"
  | "design"
  | "ux"
  | "etc"
  | "prd"
  | "wireframe"
  | "user-story";

export interface ProductSection {
  id: ProductSectionId;
  label: string;
  icon: LucideIcon;
}

export const PRODUCT_SECTIONS: readonly ProductSection[] = [
  { id: "product",    label: "Product",    icon: Compass },
  { id: "design",     label: "Design",     icon: Palette },
  { id: "ux",         label: "UX",         icon: MousePointerClick },
  { id: "etc",        label: "Etc",        icon: Shapes },
  { id: "prd",        label: "PRD",        icon: FileText },
  { id: "wireframe",  label: "Wireframe",  icon: Frame },
  { id: "user-story", label: "User Story", icon: Users },
] as const;

export interface ProductNavItem {
  /** Routable section id, or null for the product root (Overview). */
  section: ProductSectionId | null;
  label: string;
  icon: LucideIcon;
}

export interface ProductNavGroup {
  /** Ring name shown above the group in the sidebar. */
  label: string;
  items: readonly ProductNavItem[];
}

/* The four rings, core → edge. Dependencies point inward: Surface is derived
 * from Spec, Spec is written against Principles, Principles serve Intent.
 *   Intent      — why/who/what: mission, benefits, personas (the Overview)
 *   Principles  — the rules every spec follows, divided by subject
 *   Spec        — the authored source of truth (PRD)
 *   Surface     — artifacts derived from a Spec (wireframe, user story) */
export const PRODUCT_NAV_GROUPS: readonly ProductNavGroup[] = [
  {
    label: "Intent",
    items: [{ section: null, label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Principles",
    items: [
      { section: "product", label: "Product", icon: Compass },
      { section: "design", label: "Design", icon: Palette },
      { section: "ux", label: "UX", icon: MousePointerClick },
      { section: "etc", label: "Etc", icon: Shapes },
    ],
  },
  {
    label: "Spec",
    items: [{ section: "prd", label: "PRD", icon: FileText }],
  },
  {
    label: "Surface",
    items: [
      { section: "wireframe", label: "Wireframe", icon: Frame },
      { section: "user-story", label: "User Story", icon: Users },
    ],
  },
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
