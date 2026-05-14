"use client";

import { usePathname } from "next/navigation";
import { isProductSectionId, type ProductSectionId } from "@/entities/product";

interface ActiveProductSection {
  productId: string | null;
  sectionId: ProductSectionId | null;
}

const PRODUCT_ROUTE = /^\/dashboard\/products\/([^/]+)(?:\/([^/]+))?/;

export function useActiveProductSection(): ActiveProductSection {
  const pathname = usePathname();
  const match = pathname.match(PRODUCT_ROUTE);
  if (!match) return { productId: null, sectionId: null };

  const [, productId, rawSection] = match;
  const sectionId = rawSection && isProductSectionId(rawSection) ? rawSection : null;
  return { productId, sectionId };
}
