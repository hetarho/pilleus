"use client";

import { ChevronRight, Folder, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import {
  PROJECT_SECTIONS,
  projectSectionHref,
  useProjectListQuery,
} from "@/entities/project";
import { useSession } from "@/entities/session";
import { CreateProjectDialog } from "@/features/project-create";
import { cn } from "@/shared/lib/cn";
import { useIsClient } from "@/shared/lib/hooks/use-is-client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from "@/shared/ui/sidebar";
import { useActiveProjectSection } from "../model/use-active-project-section";

export function AppSidebar() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const projectsQuery = useProjectListQuery({ enabled: isAuthenticated });
  const { projectId: activeProjectId, sectionId: activeSectionId } =
    useActiveProjectSection();
  const isClient = useIsClient();

  let menuContent: React.ReactNode;
  if (!isClient || projectsQuery.isLoading) {
    menuContent = (
      <>
        <SidebarMenuItem><SidebarMenuSkeleton /></SidebarMenuItem>
        <SidebarMenuItem><SidebarMenuSkeleton /></SidebarMenuItem>
      </>
    );
  } else if (!projectsQuery.data || projectsQuery.data.length === 0) {
    menuContent = (
      <p className="px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
        No projects yet.
      </p>
    );
  } else {
    menuContent = projectsQuery.data.map((project) => {
      const isActive = activeProjectId === project.id;
      const FolderIcon = isActive ? FolderOpen : Folder;
      return (
        <Collapsible
          key={project.id}
          asChild
          defaultOpen={isActive}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip={project.name}
                className={cn(
                  isActive &&
                    "bg-sidebar-primary font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground active:bg-sidebar-primary active:text-sidebar-primary-foreground data-[state=open]:hover:bg-sidebar-primary data-[state=open]:hover:text-sidebar-primary-foreground",
                )}
              >
                <FolderIcon className="size-4" />
                <span>{project.name}</span>
                <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {PROJECT_SECTIONS.map((section) => {
                  const SectionIcon = section.icon;
                  const sectionActive =
                    isActive && activeSectionId === section.id;
                  return (
                    <SidebarMenuSubItem key={section.id}>
                      <SidebarMenuSubButton asChild isActive={sectionActive}>
                        <Link href={projectSectionHref(project.id, section.id)}>
                          <SectionIcon className="size-4" />
                          <span>{section.label}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-1 px-1.5 py-1.5">
          <SidebarTrigger className="size-7" />
          <Link
            href="/dashboard"
            className="text-base font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden"
          >
            Pilleus
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <CreateProjectDialog
            trigger={
              <SidebarGroupAction title="New project" aria-label="New project">
                <Plus className="size-4" />
              </SidebarGroupAction>
            }
          />
          <SidebarGroupContent>
            <SidebarMenu>{menuContent}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
