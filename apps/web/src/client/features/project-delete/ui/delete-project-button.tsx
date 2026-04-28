"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { Button } from "@/shared/ui/button";

interface DeleteProjectButtonProps {
  projectId: string;
}

export function DeleteProjectButton({ projectId }: DeleteProjectButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation(
    trpc.project.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.project.list.queryKey() });
      },
    })
  );

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={deleteMutation.isPending}
      onClick={() => deleteMutation.mutate({ id: projectId })}
    >
      Delete
    </Button>
  );
}
