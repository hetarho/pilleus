"use client";

import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { CreateProjectForm } from "./create-project-form";

interface CreateProjectDialogProps {
  /** Element that opens the dialog when clicked. */
  trigger: ReactNode;
}

export function CreateProjectDialog({ trigger }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Create a project to organize your specs, policies, and stories.
          </DialogDescription>
        </DialogHeader>
        <CreateProjectForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
