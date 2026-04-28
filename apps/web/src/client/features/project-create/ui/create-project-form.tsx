"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/shared/api/trpc/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export function CreateProjectForm() {
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
      },
    })
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createMutation.mutate({ name, description: description || undefined });
          }}
        >
          <Input
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
      </CardContent>
    </Card>
  );
}
