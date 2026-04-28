"use client";

import { ProjectCard, useProjectListQuery } from "@/entities/project";
import { useSession } from "@/entities/session";
import { DeleteProjectButton } from "@/features/project-delete";

export function ProjectList() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const projectsQuery = useProjectListQuery({ enabled: isAuthenticated });

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Projects</h2>
      {projectsQuery.isLoading && <p>Loading projects...</p>}
      {projectsQuery.data?.length === 0 && (
        <p className="text-muted-foreground">No projects yet.</p>
      )}
      <div className="flex flex-col gap-3">
        {projectsQuery.data?.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            action={<DeleteProjectButton projectId={project.id} />}
          />
        ))}
      </div>
    </section>
  );
}
