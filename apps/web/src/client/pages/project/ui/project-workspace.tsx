"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { parseProductRoute, productHref } from "@/entities/product";
import { useTRPC } from "@/shared/api/trpc/client";
import { cn } from "@/shared/lib/cn";
import { RingMap } from "./ring-map";

const EASE: [number, number, number, number] = [0.3, 0.05, 0.45, 1];

/* The project workspace shell. The ring is rendered ONCE here and persists
 * across overview ↔ section navigations (it lives in the route layout, so its
 * React instance never unmounts). When a section is being edited the ring
 * docks to the left and the routed editor slides in on the right; on the
 * Overview it sits centered below the identity panel. Framer Motion's `layout`
 * animates the ring smoothly between the two arrangements. */
export function ProjectWorkspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const trpc = useTRPC();
  const { productId, sectionId } = parseProductRoute(pathname);

  const productQuery = useQuery({
    ...trpc.product.get.queryOptions({ id: productId ?? "" }),
    enabled: !!productId,
  });
  const mission = productQuery.data?.mission ?? null;
  const sectionActive = sectionId !== null;

  /* No project in the path (shouldn't happen under this layout) — just render. */
  if (!productId) return <>{children}</>;

  const layoutTransition = { layout: { duration: 0.55, ease: EASE } };

  return (
    <motion.div
      layout
      transition={layoutTransition}
      className={cn(
        "flex w-full flex-1",
        sectionActive
          ? "flex-row items-stretch gap-6 p-6"
          : "flex-col items-center gap-8 px-6 py-10",
      )}
    >
      {/* Ring — single persistent instance; docks left while editing. */}
      <motion.div
        layout
        transition={layoutTransition}
        className={cn(
          sectionActive
            ? "order-1 w-60 shrink-0 self-start lg:w-72"
            : "order-2 w-full",
        )}
      >
        {sectionActive && (
          <Link
            href={productHref(productId)}
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            개요로
          </Link>
        )}
        <RingMap
          productId={productId}
          mission={mission}
          activeSection={sectionId}
          compact={sectionActive}
        />
      </motion.div>

      {/* Content — identity panel (Overview) above the ring, or the editor at right. */}
      <motion.div
        layout
        transition={layoutTransition}
        className={cn(sectionActive ? "order-2 min-w-0 flex-1" : "order-1 w-full")}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={sectionId ?? "overview"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
