"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { CreatePrdDialog } from "@/features/prd-create";
import { Button } from "@/shared/ui/button";
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

export function PrdListView({ productId }: PrdListViewProps) {
  const trpc = useTRPC();
  const productQuery = useQuery(trpc.product.get.queryOptions({ id: productId }));
  const prdsQuery = useQuery(trpc.product.prd.list.queryOptions({ productId }));

  const benefits = productQuery.data?.benefits ?? [];
  const prds = prdsQuery.data ?? [];

  return (
    <main className="relative mx-auto max-w-5xl p-8">
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
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead className="w-[40%]">Benefit</TableHead>
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
