"use client";

import { usePathname } from "next/navigation";
import { isProductSectionId, type ProductSectionId } from "@/entities/product";

interface ActiveProductSection {
  productId: string | null;
  sectionId: ProductSectionId | null;
}

const ROUTE_PATTERN = /^\/dashboard\/products\/([^/]+)\/([^/]+)/;

/**
 * Reads the currently-active product + section from the URL pathname.
 * Returns nulls when the user is not on a product-section route.
 */
export function useActiveProductSection(): ActiveProductSection {
  const pathname = usePathname();
  const match = pathname.match(ROUTE_PATTERN);
  if (!match) return { productId: null, sectionId: null };

  const [, productId, rawSection] = match;
  const sectionId = isProductSectionId(rawSection) ? rawSection : null;
  return { productId, sectionId };
}
