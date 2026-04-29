import {
  Boxes,
  Database,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ProjectSectionId =
  | "overview"
  | "prd"
  | "policy"
  | "data"
  | "element"
  | "user-story";

export interface ProjectSection {
  id: ProjectSectionId;
  label: string;
  icon: LucideIcon;
}

export const PROJECT_SECTIONS: readonly ProjectSection[] = [
  { id: "overview",   label: "Overview",   icon: LayoutDashboard },
  { id: "prd",        label: "PRD",        icon: FileText },
  { id: "policy",     label: "Policy",     icon: ShieldCheck },
  { id: "data",       label: "Data",       icon: Database },
  { id: "element",    label: "Element",    icon: Boxes },
  { id: "user-story", label: "User Story", icon: Users },
] as const;

const VALID_IDS = new Set<ProjectSectionId>(
  PROJECT_SECTIONS.map((s) => s.id),
);

export function isProjectSectionId(value: string): value is ProjectSectionId {
  return VALID_IDS.has(value as ProjectSectionId);
}

export function getProjectSection(id: ProjectSectionId): ProjectSection {
  const section = PROJECT_SECTIONS.find((s) => s.id === id);
  if (!section) throw new Error(`Unknown project section: ${id}`);
  return section;
}

export const DEFAULT_PROJECT_SECTION: ProjectSectionId = "overview";

export function projectSectionHref(projectId: string, sectionId: ProjectSectionId): string {
  return `/dashboard/projects/${projectId}/${sectionId}`;
}
