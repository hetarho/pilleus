import {
  Compass,
  FileText,
  Frame,
  Gift,
  LayoutDashboard,
  MousePointerClick,
  Palette,
  Shapes,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

/* A product is organized as four concentric rings (Clean Architecture for
 * planning): the most stable Intent at the core, the most volatile Surface at
 * the edge, dependencies pointing inward. The "Principles" ring is divided by
 * SUBJECT (what each principle is about) — never by abstraction tier. */
export type ProductSectionId =
  | "mission"
  | "persona"
  | "benefit"
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
  { id: "mission",    label: "Mission",    icon: Target },
  { id: "persona",    label: "Persona",    icon: Users },
  { id: "benefit",    label: "Benefit",    icon: Gift },
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

/* The product root (section: null). Sits ABOVE the rings as a read-only
 * summary of the Intent ring; rendered as a standalone item in the sidebar,
 * not inside any ring group. */
export const PRODUCT_OVERVIEW_ITEM: ProductNavItem = {
  section: null,
  label: "Overview",
  icon: LayoutDashboard,
};

/* The four rings, core → edge. Dependencies point inward: Surface is derived
 * from Spec, Spec is written against Principles, Principles serve Intent.
 *   Intent      — why/who/what: mission, persona, benefit (each its own section)
 *   Principles  — the rules every spec follows, divided by subject
 *   Spec        — the authored source of truth (PRD)
 *   Surface     — artifacts derived from a Spec (wireframe, user story) */
export const PRODUCT_NAV_GROUPS: readonly ProductNavGroup[] = [
  {
    label: "Intent",
    items: [
      { section: "mission", label: "Mission", icon: Target },
      { section: "persona", label: "Persona", icon: Users },
      { section: "benefit", label: "Benefit", icon: Gift },
    ],
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
  return `/project/${productId}`;
}

export function productSectionHref(productId: string, sectionId: ProductSectionId): string {
  return `/project/${productId}/${sectionId}`;
}

export function productPrdHref(productId: string, prdId: string): string {
  return `/project/${productId}/prd/${prdId}`;
}

/* Pulls the active product (and optional section) out of a pathname so the top
 * bar can highlight the current project. Mirrors the /project route shape. */
const PROJECT_ROUTE = /^\/project\/([^/]+)(?:\/([^/]+))?/;

export function parseProductRoute(pathname: string): {
  productId: string | null;
  sectionId: ProductSectionId | null;
} {
  const match = pathname.match(PROJECT_ROUTE);
  if (!match) return { productId: null, sectionId: null };
  const [, productId, rawSection] = match;
  const sectionId =
    rawSection && isProductSectionId(rawSection) ? rawSection : null;
  return { productId, sectionId };
}
