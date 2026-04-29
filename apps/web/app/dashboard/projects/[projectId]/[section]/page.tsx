import { ProjectSectionView } from "@/pages/project-section";

export default async function ProjectSectionPage({
  params,
}: {
  params: Promise<{ projectId: string; section: string }>;
}) {
  const { projectId, section } = await params;
  return <ProjectSectionView projectId={projectId} sectionId={section} />;
}
