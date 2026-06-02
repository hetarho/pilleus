"use client";

import { ChevronRight, Folder, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import {
  PRODUCT_NAV_GROUPS,
  productHref,
  productSectionHref,
  useProductListQuery,
} from "@/entities/product";
import { useSession } from "@/entities/session";
import { CreateProductDialog } from "@/features/product-create";
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
        <Collapsible
          key={product.id}
          defaultOpen={isActiveProduct}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            {/* The project name only toggles its section list open/closed —
              * navigation happens through the Overview item below. */}
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip={product.name}
                className={cn(
                  isActiveProduct &&
                    "bg-sidebar-primary font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground active:bg-sidebar-primary active:text-sidebar-primary-foreground",
                )}
              >
                <FolderIcon className="size-4" />
                <span>{product.name}</span>
                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {PRODUCT_NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="px-2 pt-3 pb-1 text-[0.625rem] font-medium uppercase tracking-wider text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
                    {group.label}
                  </div>
                  <SidebarMenuSub>
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const href =
                        item.section === null
                          ? productHref(product.id)
                          : productSectionHref(product.id, item.section);
                      const itemActive =
                        item.section === null
                          ? isOnProjectRoot
                          : isActiveProduct && activeSectionId === item.section;
                      return (
                        <SidebarMenuSubItem key={item.label}>
                          <SidebarMenuSubButton asChild isActive={itemActive}>
                            <Link href={href}>
                              <ItemIcon className="size-4" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </div>
              ))}
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
