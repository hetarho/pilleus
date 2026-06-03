import { useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

/**
 * Shared scaffolding for create/edit dialogs. Tracks open state and exposes
 * an `onSaved` handler that invalidates the affected list query and closes the
 * dialog — the wiring every edit dialog used to repeat. The form fields and
 * the create/update mutations stay in each dialog, since those genuinely differ.
 */
export function useEditDialog(listQueryKey: QueryKey) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const onSaved = () => {
    void queryClient.invalidateQueries({ queryKey: listQueryKey });
    setOpen(false);
  };

  return { open, setOpen, onSaved };
}
