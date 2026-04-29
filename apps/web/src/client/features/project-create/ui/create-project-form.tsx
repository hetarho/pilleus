"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface CreateProjectFormProps {
  onSuccess?: () => void;
}

export function CreateProjectForm({ onSuccess }: CreateProjectFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation(
    trpc.project.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.project.list.queryKey() });
        setName("");
        setDescription("");
        onSuccess?.();
      },
    }),
  );

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        createMutation.mutate({ name, description: description || undefined });
      }}
    >
      <Input
        autoFocus
        placeholder="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
        {createMutation.isPending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
