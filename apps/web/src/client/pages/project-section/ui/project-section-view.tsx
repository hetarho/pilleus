"use client";

import { notFound } from "next/navigation";
import {
  getProjectSection,
  isProjectSectionId,
  useProjectListQuery,
  type ProjectSectionId,
} from "@/entities/project";

interface ProjectSectionViewProps {
  projectId: string;
  sectionId: string;
}

export function ProjectSectionView({ projectId, sectionId }: ProjectSectionViewProps) {
  if (!isProjectSectionId(sectionId)) notFound();

  const projects = useProjectListQuery();
  const project = projects.data?.find((p) => p.id === projectId);
  const section = getProjectSection(sectionId as ProjectSectionId);
  const Icon = section.icon;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center gap-3">
        <Icon className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">{section.label}</h1>
          {project && (
            <p className="text-sm text-muted-foreground">{project.name}</p>
          )}
        </div>
      </div>
      <div className="bg-card p-6 text-muted-foreground">
        <p className="text-sm">
          This is the {section.label.toLowerCase()} section of {project?.name ?? "this project"}.
          Content for this section is not implemented yet.
        </p>
      </div>
    </main>
  );
}
