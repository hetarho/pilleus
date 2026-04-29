"use client";

import { FolderKanban } from "lucide-react";
import { useProjectListQuery } from "@/entities/project";
import { useSession } from "@/entities/session";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/shared/ui/sidebar";
import { useSelectedProject } from "../model/use-selected-project";

export function AppSidebar() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const projectsQuery = useProjectListQuery({ enabled: isAuthenticated });
  const { selectedId, select } = useSelectedProject();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <FolderKanban className="size-4 text-sidebar-foreground" />
          <span className="text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Workspace
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projectsQuery.isLoading && (
                <>
                  <SidebarMenuItem><SidebarMenuSkeleton /></SidebarMenuItem>
                  <SidebarMenuItem><SidebarMenuSkeleton /></SidebarMenuItem>
                </>
              )}
              {projectsQuery.data?.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                  No projects yet.
                </p>
              )}
              {projectsQuery.data?.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    isActive={selectedId === project.id}
                    onClick={() =>
                      select(selectedId === project.id ? null : project.id)
                    }
                    tooltip={project.name}
                  >
                    <FolderKanban className="size-4" />
                    <span>{project.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
