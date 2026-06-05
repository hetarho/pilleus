"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  isProductSectionId,
  parseProductRoute,
  productHref,
} from "@/entities/product";
import { useTRPC } from "@/shared/api/trpc/client";
import { useIsMobile } from "@/shared/lib/hooks/use-mobile";
import { cn } from "@/shared/lib/cn";
import { ProjectView } from "./project-view";
import { RingMap } from "./ring-map";

const EASE: [number, number, number, number] = [0.3, 0.05, 0.45, 1];

/* The project workspace shell.
 *
 * The identity panel and the ring are rendered HERE (not via `children`) and
 * stay mounted, so they never reflow on their own. A section editor is the only
 * `children`, so it can never flash in the centered slot before opening.
 * `useSelectedLayoutSegment` (not the pathname) drives the mode so it's in sync
 * with which `children` are mounted.
 *
 * Desktop: a 4:6 split. The editor expands in from the right while the ring is
 * pushed into the left 40% (flexbox does the easing — no transform distortion).
 * Mobile: the editor rises as a bottom sheet while the ring lifts and shrinks. */
export function ProjectWorkspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segment = useSelectedLayoutSegment();
  const isMobile = useIsMobile();
  const trpc = useTRPC();

  const { productId } = parseProductRoute(pathname);
  const sectionActive = segment !== null;
  const activeSection =
    segment && isProductSectionId(segment) ? segment : null;

  const productQuery = useQuery({
    ...trpc.product.get.queryOptions({ id: productId ?? "" }),
    enabled: !!productId,
  });
  const mission = productQuery.data?.mission ?? null;

  /* No project in the path (shouldn't happen under this layout) — just render. */
  if (!productId) return <>{children}</>;

  const backLink = (
    <Link
      href={productHref(productId)}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="size-3.5" />
      개요로
    </Link>
  );

  return (
    <div
      className={cn(
        "relative flex flex-1 overflow-hidden",
        isMobile ? "flex-col" : "flex-row",
      )}
    >
      {/* Identity + ring. On desktop this is a flex child that shrinks to ~40%
       * as the editor grows (ring slides left). On mobile the editor overlays,
       * so the ring lifts and shrinks via its own transform instead. */}
      <motion.div
        className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-8 px-6 py-8"
        animate={
          isMobile
            ? {
                y: sectionActive ? "-10%" : "0%",
                scale: sectionActive ? 0.82 : 1,
              }
            : { y: "0%", scale: 1 }
        }
        transition={{ duration: 0.5, ease: EASE }}
      >
        <motion.div
          className={cn("w-full max-w-2xl", sectionActive && "pointer-events-none")}
          animate={{ opacity: sectionActive ? 0.45 : 1 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <ProjectView productId={productId} />
        </motion.div>

        <div className="w-full max-w-2xl">
          <RingMap
            productId={productId}
            mission={mission}
            activeSection={activeSection}
            compact={sectionActive}
          />
        </div>
      </motion.div>

      {/* Section editor — a hidden page that comes out: from the right on
       * desktop (pushing the split to 4:6), from the bottom as a sheet on
       * mobile. No border; it's a page, not a sidebar. */}
      <AnimatePresence>
        {sectionActive &&
          (isMobile ? (
            <motion.div
              key={segment}
              className="absolute inset-x-0 bottom-0 z-20 flex h-[82%] flex-col overflow-hidden rounded-t-2xl bg-background shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
              <div className="px-6 pt-3">{backLink}</div>
              <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            </motion.div>
          ) : (
            <motion.div
              key={segment}
              className="relative h-full shrink-0 overflow-hidden"
              initial={{ width: "0%" }}
              animate={{ width: "60%" }}
              exit={{ width: "0%" }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              {/* Fixed-width inner so content doesn't reflow while the panel
               * width animates; the growing clip reveals it from the right. */}
              <div className="absolute right-0 top-0 flex h-full w-[60vw] flex-col overflow-y-auto bg-background">
                <div className="px-6 pt-5">{backLink}</div>
                <div className="min-h-0 flex-1">{children}</div>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}
