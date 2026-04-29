"use client";

import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

const PARAM = "project";

export function useSelectedProject() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get(PARAM);

  const select = useCallback(
    (projectId: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (projectId) next.set(PARAM, projectId);
      else next.delete(PARAM);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { selectedId, select };
}
