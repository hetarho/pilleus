"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  PRODUCT_NAV_GROUPS,
  productSectionHref,
  useBenefitListQuery,
  usePersonaListQuery,
  type ProductNavGroup,
  type ProductNavItem,
  type ProductSectionId,
} from "@/entities/product";
import { useTRPC } from "@/shared/api/trpc/client";
import { cn } from "@/shared/lib/cn";

/* The four rings, OUTER → INNER, so they can be nested as concentric bands.
 * PRODUCT_NAV_GROUPS is core → edge, so reverse it. */
const RINGS_OUTER_FIRST: readonly ProductNavGroup[] = [...PRODUCT_NAV_GROUPS].reverse();

/** One-line role per ring — the "what is this layer for" caption. */
const RING_ROLE: Record<string, string> = {
  Intent: "왜 · 누구를 위해 · 무엇을",
  Principles: "어떻게 만들 것인가의 규칙",
  Spec: "무엇을 만드는가",
  Surface: "사용자가 실제로 보는 것",
};

/* Background intensity encodes stability: the core (Intent) is solid primary —
 * the most stable; each outer ring fades toward the edge — the most volatile.
 * No borders; the layers are separated purely by background tone. */
const RING_BG: Record<string, string> = {
  Surface: "bg-primary/[0.06]",
  Spec: "bg-primary/[0.11]",
  Principles: "bg-primary/[0.17]",
  Intent: "bg-primary text-primary-foreground",
};

interface RingMapProps {
  productId: string;
  mission: string | null;
}

/** Product Overview, visualized: the planning layers as concentric rings,
 * mirroring the Clean Architecture diagram. Each artifact chip links into its
 * section; live counts/fill come from the Intent and Spec rings. */
export function RingMap({ productId, mission }: RingMapProps) {
  const trpc = useTRPC();
  const personasQuery = usePersonaListQuery(productId);
  const benefitsQuery = useBenefitListQuery(productId);
  const prdsQuery = useQuery(trpc.product.prd.list.queryOptions({ productId }));

  const count: Partial<Record<ProductSectionId, number>> = {
    persona: personasQuery.data?.length ?? 0,
    benefit: benefitsQuery.data?.length ?? 0,
    prd: prdsQuery.data?.length ?? 0,
  };
  const filled: Partial<Record<ProductSectionId, boolean>> = {
    mission: !!mission,
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs text-muted-foreground">
        안쪽일수록 안정적 · 바깥일수록 휘발적 · 의존성은 안쪽으로 흐른다
      </p>
      <NestedRings
        rings={RINGS_OUTER_FIRST}
        depth={0}
        productId={productId}
        count={count}
        filled={filled}
      />
    </div>
  );
}

function NestedRings({
  rings,
  depth,
  productId,
  count,
  filled,
}: {
  rings: readonly ProductNavGroup[];
  depth: number;
  productId: string;
  count: Partial<Record<ProductSectionId, number>>;
  filled: Partial<Record<ProductSectionId, boolean>>;
}) {
  const [ring, ...rest] = rings;
  if (!ring) return null;
  const isCore = rest.length === 0;

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.3, 0.05, 0.45, 1], delay: depth * 0.06 }}
      className={cn(
        "flex w-full flex-col items-center gap-3 rounded-[2rem] p-5 text-center shadow-sm sm:p-7",
        RING_BG[ring.label],
      )}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "text-[0.7rem] font-semibold uppercase tracking-[0.2em]",
            isCore ? "text-primary-foreground/85" : "text-foreground/55",
          )}
        >
          {ring.label}
        </span>
        <span className={cn("text-xs", isCore ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {RING_ROLE[ring.label]}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {ring.items.map((item) => (
          <Chip
            key={item.label}
            item={item}
            productId={productId}
            isCore={isCore}
            count={item.section ? count[item.section] : undefined}
            filled={item.section ? filled[item.section] : undefined}
          />
        ))}
      </div>

      {!isCore && (
        <NestedRings
          rings={rest}
          depth={depth + 1}
          productId={productId}
          count={count}
          filled={filled}
        />
      )}
    </motion.section>
  );
}

function Chip({
  item,
  productId,
  isCore,
  count,
  filled,
}: {
  item: ProductNavItem;
  productId: string;
  isCore: boolean;
  count?: number;
  filled?: boolean;
}) {
  const Icon = item.icon;
  if (!item.section) return null;

  return (
    <Link
      href={productSectionHref(productId, item.section)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-xs transition-colors",
        isCore
          ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25"
          : "bg-card text-foreground hover:bg-card/70",
      )}
    >
      <Icon className="size-3.5" />
      <span>{item.label}</span>
      {count != null && count > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[0.65rem] font-semibold",
            isCore ? "bg-primary-foreground/25" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
      {filled != null && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            filled
              ? isCore
                ? "bg-primary-foreground"
                : "bg-primary"
              : isCore
                ? "bg-primary-foreground/30"
                : "bg-muted-foreground/40",
          )}
        />
      )}
    </Link>
  );
}
