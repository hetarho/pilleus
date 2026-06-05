"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
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

const EASE: [number, number, number, number] = [0.3, 0.05, 0.45, 1];

type RingLabel = "Intent" | "Principles" | "Spec" | "Surface";

/** Plain-spoken one-liners (varied length, no triads) describing each ring. */
const RING_ROLE: Record<RingLabel, string> = {
  Intent: "왜 만드는지, 누구를 위한 건지. 한번 정하면 좀처럼 안 바꿔요.",
  Principles: "팀이 미리 합의해 둔 규칙. 매번 처음부터 정하기 싫어서 적어둬요.",
  Spec: "실제로 만들 기능을 적어 내려가는 곳. PRD가 여기 삽니다.",
  Surface: "사용자 눈에 닿는 마지막 한 겹. 제일 자주 바뀌어요.",
};

/* Geometry per ring (viewBox 0..100, centered at 50,50).
 *   disc  — filled radius; smaller = closer to the stable core
 *   fill  — element opacity of the disc (core is solid)
 *   orbit — radius where this ring's nodes sit (null = stacked in the core)
 *   at    — angles (deg, 0°=east, CCW) placing each node around the orbit */
const RING_GEO: Record<RingLabel, { disc: number; fill: number; orbit: number | null; at: number[] }> = {
  Intent: { disc: 16, fill: 1, orbit: null, at: [] },
  Principles: { disc: 27.5, fill: 0.17, orbit: 21.5, at: [45, 135, 225, 315] },
  Spec: { disc: 38.5, fill: 0.1, orbit: 32.5, at: [90] },
  Surface: { disc: 49.5, fill: 0.055, orbit: 43, at: [215, 325] },
};

/* Legend swatch tones — a visible intensity ramp (the bands themselves are far
 * fainter). Core is solid, edge is light. */
const SWATCH: Record<RingLabel, string> = {
  Intent: "bg-primary",
  Principles: "bg-primary/70",
  Spec: "bg-primary/45",
  Surface: "bg-primary/25",
};

const ORDER: readonly RingLabel[] = ["Intent", "Principles", "Spec", "Surface"];

interface RingMapProps {
  productId: string;
  mission: string | null;
  /** Section currently being edited; its ring is spotlit and node highlighted. */
  activeSection?: ProductSectionId | null;
  /** Docked/navigator mode: smaller, no intro copy or legend. */
  compact?: boolean;
}

/** Which ring a given section lives in (mission/persona/benefit → Intent, …). */
function ringOfSection(section: ProductSectionId): RingLabel | null {
  for (const group of PRODUCT_NAV_GROUPS) {
    if (group.items.some((i) => i.section === section)) {
      return group.label as RingLabel;
    }
  }
  return null;
}

/** The product's planning layers, drawn as concentric orbits. The stable core
 * (Intent) holds mission/persona/benefit; the outer rings orbit it, each
 * artifact a node you can click into. Hover a legend row to light up its ring;
 * the section being edited stays spotlit. */
export function RingMap({ productId, mission, activeSection = null, compact = false }: RingMapProps) {
  const trpc = useTRPC();
  const personasQuery = usePersonaListQuery(productId);
  const benefitsQuery = useBenefitListQuery(productId);
  const prdsQuery = useQuery(trpc.product.prd.list.queryOptions({ productId }));

  const [hovered, setHovered] = useState<RingLabel | null>(null);

  const groups = Object.fromEntries(
    PRODUCT_NAV_GROUPS.map((g) => [g.label, g]),
  ) as Record<RingLabel, ProductNavGroup>;

  const count: Partial<Record<ProductSectionId, number>> = {
    persona: personasQuery.data?.length ?? 0,
    benefit: benefitsQuery.data?.length ?? 0,
    prd: prdsQuery.data?.length ?? 0,
  };
  const filled: Partial<Record<ProductSectionId, boolean>> = { mission: !!mission };

  /* Hover wins while present; otherwise the edited section's ring stays lit. */
  const activeRing = activeSection ? ringOfSection(activeSection) : null;
  const spotlight = hovered ?? activeRing;
  const dim = (label: RingLabel) => spotlight != null && spotlight !== label;

  return (
    <div className={cn("flex w-full flex-col items-center", compact ? "gap-4" : "gap-7")}>
      {!compact && (
        <p className="max-w-md text-center text-xs leading-relaxed text-muted-foreground">
          바깥 링은 안쪽 링에 기대어 있어요. 가운데 뿌리를 건드리면 바깥쪽이 전부 흔들립니다.
        </p>
      )}

      {/* Size stays constant across modes; the workspace shell scales the whole
       * ring with a transform so the shrink animates smoothly (no layout snap). */}
      <div className="relative mx-auto aspect-square w-full max-w-124">
        {/* Soft, slowly breathing glow behind the core. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-[42%] rounded-full bg-primary blur-2xl"
          style={{ x: "-50%", y: "-50%" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.25, 0.42, 0.25] }}
          transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
        />

        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
          {/* Filled bands, drawn largest → smallest so they read as nested rings. */}
          {[...ORDER].reverse().map((label, i) => {
            const geo = RING_GEO[label];
            const target = dim(label) ? geo.fill * 0.4 : spotlight === label ? Math.min(1, geo.fill * 1.6) : geo.fill;
            return (
              <motion.circle
                key={label}
                cx={50}
                cy={50}
                r={geo.disc}
                className="fill-current text-primary"
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: target, scale: 1 }}
                transition={{ duration: 0.3, ease: EASE, delay: (3 - i) * 0.08 }}
              />
            );
          })}

          {/* Decorative orbit guides — a faint dashed system, rotating slowly. */}
          <motion.g
            className="text-primary"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 90, ease: "linear", repeat: Infinity }}
          >
            {ORDER.filter((l) => RING_GEO[l].orbit != null).map((l) => (
              <circle
                key={l}
                cx={50}
                cy={50}
                r={RING_GEO[l].orbit as number}
                fill="none"
                stroke="currentColor"
                strokeWidth={0.25}
                strokeDasharray="0.6 2.4"
                opacity={0.18}
              />
            ))}
          </motion.g>
        </svg>

        {/* Core: the Intent ring, stacked at the center. */}
        <motion.div
          className="absolute left-1/2 top-1/2 flex w-[34%] flex-col items-center gap-1.5"
          style={{ x: "-50%", y: "-50%" }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: dim("Intent") ? 0.4 : 1, scale: 1 }}
          transition={{ duration: 0.3, ease: EASE, delay: 0.1 }}
        >
          {groups.Intent.items.map((item) => (
            <Node
              key={item.label}
              item={item}
              productId={productId}
              tone="core"
              active={item.section != null && item.section === activeSection}
              count={item.section ? count[item.section] : undefined}
              filled={item.section ? filled[item.section] : undefined}
            />
          ))}
        </motion.div>

        {/* Outer rings: each artifact orbits on its band. */}
        {(["Principles", "Spec", "Surface"] as RingLabel[]).flatMap((label, ringIdx) => {
          const geo = RING_GEO[label];
          return groups[label].items.map((item, i) => {
            const a = ((geo.at[i] ?? 0) * Math.PI) / 180;
            const left = 50 + (geo.orbit as number) * Math.cos(a);
            const top = 50 - (geo.orbit as number) * Math.sin(a);
            return (
              <motion.div
                key={item.label}
                className="absolute"
                style={{ left: `${left}%`, top: `${top}%`, x: "-50%", y: "-50%" }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: dim(label) ? 0.35 : 1, scale: 1 }}
                transition={{ duration: 0.25, ease: EASE, delay: 0.34 + ringIdx * 0.08 + i * 0.04 }}
              >
                <Node
                  item={item}
                  productId={productId}
                  tone="orbit"
                  active={item.section != null && item.section === activeSection}
                  count={item.section ? count[item.section] : undefined}
                  filled={item.section ? filled[item.section] : undefined}
                />
              </motion.div>
            );
          });
        })}
      </div>

      {/* Legend — names + plain-language roles; hover to spotlight a ring. */}
      {!compact && (
      <div className="flex w-full max-w-md flex-col gap-1">
        {ORDER.map((label) => (
          <div
            key={label}
            onMouseEnter={() => setHovered(label)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "flex items-start gap-3 rounded-xl p-2.5 transition-colors",
              hovered === label ? "bg-muted" : "bg-transparent",
            )}
          >
            <span className={cn("mt-0.5 size-3 shrink-0 rounded-md", SWATCH[label])} />
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wide">{label}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{RING_ROLE[label]}</span>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

function Node({
  item,
  productId,
  tone,
  active = false,
  count,
  filled,
}: {
  item: ProductNavItem;
  productId: string;
  tone: "core" | "orbit";
  active?: boolean;
  count?: number;
  filled?: boolean;
}) {
  const Icon = item.icon;
  if (!item.section) return null;
  const isCore = tone === "core";

  return (
    <Link
      href={productSectionHref(productId, item.section)}
      className={cn(
        "inline-flex w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition-transform duration-150 hover:scale-[1.06]",
        isCore
          ? "justify-center bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25"
          : "bg-card text-foreground hover:shadow-md",
        active &&
          (isCore
            ? "bg-primary-foreground text-primary ring-2 ring-primary-foreground"
            : "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"),
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="whitespace-nowrap">{item.label}</span>
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
            "size-1.5 shrink-0 rounded-full",
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
