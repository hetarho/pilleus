"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { Button } from "@/shared/ui/button";

interface DeleteProductButtonProps {
  productId: string;
}

export function DeleteProductButton({ productId }: DeleteProductButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation(
    trpc.product.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.product.list.queryKey() });
      },
    }),
  );

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={deleteMutation.isPending}
      onClick={() => deleteMutation.mutate({ id: productId })}
    >
      Delete
    </Button>
  );
}
