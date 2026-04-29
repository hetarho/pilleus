"use client";

import { usePathname } from "next/navigation";
import { isProjectSectionId, type ProjectSectionId } from "@/entities/project";

interface ActiveProjectSection {
  projectId: string | null;
  sectionId: ProjectSectionId | null;
}

const ROUTE_PATTERN = /^\/dashboard\/projects\/([^/]+)\/([^/]+)/;

/**
 * Reads the currently-active project + section from the URL pathname.
 * Returns nulls when the user is not on a project-section route.
 */
export function useActiveProjectSection(): ActiveProjectSection {
  const pathname = usePathname();
  const match = pathname.match(ROUTE_PATTERN);
  if (!match) return { projectId: null, sectionId: null };

  const [, projectId, rawSection] = match;
  const sectionId = isProjectSectionId(rawSection) ? rawSection : null;
  return { projectId, sectionId };
}
