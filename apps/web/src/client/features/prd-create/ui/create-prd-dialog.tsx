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
import { CreatePrdForm } from "./create-prd-form";

interface CreatePrdDialogProps {
  productId: string;
  /** Element that opens the dialog when clicked. */
  trigger: ReactNode;
}

export function CreatePrdDialog({ productId, trigger }: CreatePrdDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New PRD</DialogTitle>
          <DialogDescription>
            Add a Product Requirements Document. You can fill in the body afterwards.
          </DialogDescription>
        </DialogHeader>
        <CreatePrdForm productId={productId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
