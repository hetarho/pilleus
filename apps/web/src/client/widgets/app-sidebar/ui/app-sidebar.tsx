"use client";

import { Folder, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import {
  PRODUCT_SECTIONS,
  productHref,
  productSectionHref,
  useProductListQuery,
} from "@/entities/product";
import { useSession } from "@/entities/session";
import { CreateProductDialog } from "@/features/product-create";
import { cn } from "@/shared/lib/cn";
import { useIsClient } from "@/shared/lib/hooks/use-is-client";
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
import { useActiveProductSection } from "../model/use-active-product-section";

export function AppSidebar() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const productsQuery = useProductListQuery({ enabled: isAuthenticated });
  const { productId: activeProductId, sectionId: activeSectionId } =
    useActiveProductSection();
  const isClient = useIsClient();

  let menuContent: React.ReactNode;
  if (!isClient || productsQuery.isLoading) {
    menuContent = (
      <>
        <SidebarMenuItem><SidebarMenuSkeleton /></SidebarMenuItem>
        <SidebarMenuItem><SidebarMenuSkeleton /></SidebarMenuItem>
      </>
    );
  } else if (!productsQuery.data || productsQuery.data.length === 0) {
    menuContent = (
      <p className="px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
        No products yet.
      </p>
    );
  } else {
    menuContent = productsQuery.data.map((product) => {
      const isActiveProduct = activeProductId === product.id;
      const isOnProjectRoot = isActiveProduct && activeSectionId === null;
      const FolderIcon = isActiveProduct ? FolderOpen : Folder;
      return (
        <SidebarMenuItem key={product.id}>
          <SidebarMenuButton
            asChild
            tooltip={product.name}
            isActive={isOnProjectRoot}
            className={cn(
              isActiveProduct &&
                "bg-sidebar-primary font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground active:bg-sidebar-primary active:text-sidebar-primary-foreground",
            )}
          >
            <Link href={productHref(product.id)}>
              <FolderIcon className="size-4" />
              <span>{product.name}</span>
            </Link>
          </SidebarMenuButton>
          {isActiveProduct && (
            <SidebarMenuSub>
              {PRODUCT_SECTIONS.map((section) => {
                const SectionIcon = section.icon;
                const sectionActive = activeSectionId === section.id;
                return (
                  <SidebarMenuSubItem key={section.id}>
                    <SidebarMenuSubButton asChild isActive={sectionActive}>
                      <Link href={productSectionHref(product.id, section.id)}>
                        <SectionIcon className="size-4" />
                        <span>{section.label}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
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
          <SidebarGroupLabel>Products</SidebarGroupLabel>
          <CreateProductDialog
            trigger={
              <SidebarGroupAction title="New product" aria-label="New product">
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
