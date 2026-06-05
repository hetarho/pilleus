"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  parseProductRoute,
  productHref,
  useProductListQuery,
} from "@/entities/product";
import { useSession } from "@/entities/session";
import { CreateProductForm } from "@/features/product-create";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

/* The new primary navigation: a centered dropdown that replaces the sidebar.
 * It shows the active project and lets you switch between projects or create a
 * new one. The active project is read from the /project/{id} pathname. */
export function ProjectSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const productsQuery = useProductListQuery({ enabled: isAuthenticated });

  const [createOpen, setCreateOpen] = useState(false);

  const { productId: activeProductId } = parseProductRoute(pathname);
  const products = productsQuery.data ?? [];
  const activeProduct = products.find((p) => p.id === activeProductId) ?? null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-9 cursor-pointer gap-2 px-3 text-sm font-semibold focus-visible:border-transparent focus-visible:ring-0 data-[state=open]:bg-accent"
          >
            <span className="max-w-56 truncate">
              {activeProduct?.name ?? "프로젝트 선택"}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-64">
          {products.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              아직 프로젝트가 없습니다.
            </p>
          ) : (
            products.map((product) => (
              <DropdownMenuItem
                key={product.id}
                onSelect={() => router.push(productHref(product.id))}
                className="cursor-pointer gap-2"
              >
                <Check
                  className={cn(
                    "size-4 shrink-0",
                    product.id === activeProductId
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />
                <span className="truncate">{product.name}</span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              /* Keep the dropdown's close from racing the dialog's open. */
              e.preventDefault();
              setCreateOpen(true);
            }}
            className="cursor-pointer gap-2"
          >
            <Plus className="size-4 shrink-0" />
            <span>새 프로젝트</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 프로젝트</DialogTitle>
            <DialogDescription>
              스펙·정책·스토리를 정리할 프로젝트를 만드세요.
            </DialogDescription>
          </DialogHeader>
          <CreateProductForm onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
