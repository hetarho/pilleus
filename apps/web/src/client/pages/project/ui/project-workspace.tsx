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
import { RingMap } from "./ring-map";

const EASE: [number, number, number, number] = [0.3, 0.05, 0.45, 1];

/* The project workspace shell.
 *
 * The identity panel and the ring are rendered HERE (not via `children`) and
 * stay mounted, so a section editor is the only `children` and can never flash
 * in the centered slot. `useSelectedLayoutSegment` (not the pathname) drives the
 * mode so it's in lockstep with which `children` are mounted.
 *
 * The editor is a real sibling that PUSHES the ring — it never overlaps it. On
 * desktop it grows in from the right to a 4:6 split (ring pushed into the left
 * 40%); on mobile it grows up from the bottom (ring pushed up into the top
 * 40%). Either way flexbox eases the ring across — no transforms, no overlap.
 * Its inner content is a fixed size pinned to the leading edge, so it slides
 * cleanly into view instead of revealing an empty margin first. */
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
        "flex flex-1 overflow-hidden",
        isMobile ? "flex-col" : "flex-row",
      )}
    >
      {/* Ring — flex-1, pushed (and eased) by the editor. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          <RingMap
            productId={productId}
            mission={mission}
            activeSection={activeSection}
            compact={sectionActive}
          />
        </div>
      </div>

      {/* Section editor — a sibling that pushes the ring (no overlap). The PANEL
       * only slides on open/close (stable key, so switching sections doesn't
       * re-slide it); the CONTENT crossfades by segment. Sizing uses vh/% that
       * resolve reliably (a `%` height collapses under the min-h-screen chain).
       * Grows in from the right (desktop) or up from the bottom (mobile). */}
      <AnimatePresence>
        {sectionActive && (
          <motion.div
            /* Keyed by mode (not segment) so it slides only on open/close, but
             * REMOUNTS cleanly if the layout flips between sheet/panel — e.g.
             * after a reload, where useIsMobile resolves from false→true post
             * mount. Without this the abandoned width axis stays at ~0% and the
             * sheet is invisible. */
            key={isMobile ? "section-sheet" : "section-panel"}
            className="relative shrink-0 overflow-hidden bg-background"
            initial={isMobile ? { height: "0vh" } : { width: "0%" }}
            animate={isMobile ? { height: "62vh" } : { width: "60%" }}
            exit={isMobile ? { height: "0vh" } : { width: "0%" }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div
              className={cn(
                "absolute left-0 top-0 flex flex-col overflow-y-auto bg-background",
                isMobile ? "h-full w-full" : "h-full w-[60vw]",
              )}
            >
              <div className="shrink-0 px-6 pt-5">{backLink}</div>
              <motion.div
                key={segment}
                className="min-h-0 flex-1"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {children}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
