import {
  Boxes,
  FileText,
  Frame,
  LayoutDashboard,
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

export interface ProductNavItem {
  /** Routable section id, or null for the product root (Overview). */
  section: ProductSectionId | null;
  label: string;
  icon: LucideIcon;
}

export interface ProductNavGroup {
  /** Heading shown above the group in the sidebar. */
  label: string;
  items: readonly ProductNavItem[];
}

/* Sidebar grouping. "Foundation" is the groundwork defined before feature
 * planning (the product's identity, its rules, its design language).
 * "Planning" is the feature-spec pipeline, where the PRD is the source the
 * wireframe and user story are derived from. The project name itself is only
 * a collapse toggle — Overview (the product root) lives here as an item. */
export const PRODUCT_NAV_GROUPS: readonly ProductNavGroup[] = [
  {
    label: "Foundation",
    items: [
      { section: null, label: "Overview", icon: LayoutDashboard },
      { section: "policy", label: "Policy", icon: ShieldCheck },
      { section: "design", label: "Design System", icon: Palette },
    ],
  },
  {
    label: "Planning",
    items: [
      { section: "prd", label: "PRD", icon: FileText },
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
