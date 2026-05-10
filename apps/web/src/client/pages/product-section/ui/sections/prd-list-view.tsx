"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { CreatePrdDialog } from "@/features/prd-create";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

interface PrdListViewProps {
  productId: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "초안",
  published: "발행",
  ai_reviewed: "AI 리뷰",
};

export function PrdListView({ productId }: PrdListViewProps) {
  const trpc = useTRPC();
  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));
  const prdsQuery = useQuery(trpc.product.prd.list.queryOptions({ productId }));

  const benefits = productQuery.data?.benefits ?? [];
  const prds = prdsQuery.data ?? [];

  return (
    <main className="relative mx-auto w-full max-w-5xl p-8">
      {prdsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading PRDs...</p>
      ) : prds.length === 0 ? (
        <div className="bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No PRDs yet. Click + to add the first one.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">Title</TableHead>
              <TableHead className="w-[30%]">Benefit</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[10%]">Version</TableHead>
              <TableHead>ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prds.map((prd) => {
              const benefit =
                prd.benefitIndex != null && benefits[prd.benefitIndex]
                  ? benefits[prd.benefitIndex]
                  : null;
              return (
                <TableRow
                  key={prd.id}
                  className="cursor-pointer"
                  data-prd-row
                >
                  <TableCell>
                    <Link
                      href={`/dashboard/products/${productId}/prd/${prd.id}`}
                      className="block font-medium hover:underline"
                    >
                      {prd.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {benefit ?? <span className="opacity-40">—</span>}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        prd.status === "draft" && "bg-muted text-muted-foreground",
                        prd.status === "published" && "bg-primary/15 text-primary",
                        prd.status === "ai_reviewed" && "bg-accent text-accent-foreground",
                      )}
                    >
                      {STATUS_LABEL[prd.status] ?? prd.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {prd.latestVersion != null ? `v${prd.latestVersion}` : (
                      <span className="opacity-40">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {prd.id.slice(0, 8)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <CreatePrdDialog
        productId={productId}
        trigger={
          <Button
            size="icon"
            className="fixed right-8 bottom-8 size-14 rounded-full shadow-lg"
            aria-label="New PRD"
          >
            <Plus className="size-6" />
          </Button>
        }
      />
    </main>
  );
}
