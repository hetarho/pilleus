import { ProjectWorkspace } from "@/pages/project";

/* Wraps the Overview, every section editor, and PRD detail in the persistent
 * ring workspace so the ring animates between centered and docked instead of
 * remounting on each navigation. */
export default function ProjectIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProjectWorkspace>{children}</ProjectWorkspace>;
}
