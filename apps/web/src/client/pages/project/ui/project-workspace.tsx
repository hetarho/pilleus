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
import { cn } from "@/shared/lib/cn";
import { ProjectView } from "./project-view";
import { RingMap } from "./ring-map";

const EASE: [number, number, number, number] = [0.3, 0.05, 0.45, 1];

/* The project workspace shell.
 *
 * The identity panel and the ring are rendered HERE (not via `children`) and
 * stay mounted the whole time, so the ring never reflows — it only eases a
 * touch smaller in place. Section editors arrive as a panel that slides in
 * from the right over the canvas. `children` is therefore only ever the
 * section editor (the Overview route renders nothing), which is why the editor
 * can never flash in the center before sliding in.
 *
 * `useSelectedLayoutSegment` (not the pathname) decides the mode so it stays in
 * lockstep with which `children` are mounted. */
export function ProjectWorkspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segment = useSelectedLayoutSegment();
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

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-8">
      {/* Identity + ring — always mounted and centered, so the ring keeps its
       * place. Identity dims and stops taking clicks while a section is open;
       * the ring eases slightly smaller in place (transform only). */}
      <div className="flex w-full max-w-2xl flex-col items-center gap-8">
        <motion.div
          className={cn("w-full", sectionActive && "pointer-events-none")}
          animate={{ opacity: sectionActive ? 0.45 : 1 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <ProjectView productId={productId} />
        </motion.div>

        <motion.div
          className="w-full"
          animate={{ scale: sectionActive ? 0.9 : 1 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <RingMap
            productId={productId}
            mission={mission}
            activeSection={activeSection}
            compact={sectionActive}
          />
        </motion.div>
      </div>

      {/* Section editor — slides in from the right over the canvas. */}
      <AnimatePresence>
        {sectionActive && (
          <motion.aside
            key={segment}
            className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col overflow-y-auto border-l bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div className="px-6 pt-5">
              <Link
                href={productHref(productId)}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="size-3.5" />
                개요로
              </Link>
            </div>
            <div className="min-h-0 flex-1">{children}</div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
