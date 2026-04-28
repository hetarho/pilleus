import type { ReactNode } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import type { Project } from "../model/types";

interface ProjectCardProps {
  project: Project;
  action?: ReactNode;
}

export function ProjectCard({ project, action }: ProjectCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="font-medium">{project.name}</p>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
