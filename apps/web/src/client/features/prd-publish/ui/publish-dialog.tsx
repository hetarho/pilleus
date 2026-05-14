"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/shared/api/trpc/client";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

interface PublishDialogProps {
  prdId: string;
  /** Parent product id — used to invalidate the PRD list query alongside
   * the detail query, so the list view reflects the new status/title. */
  productId: string;
}

/**
 * "발행하기" dialog. Submits the raw LLM response to the server, which
 * extracts the markdown body, persists it, and flips status to published.
 *
 * The dialog owns the mutation directly — that way the parent page does
 * not need to know about LLM-response shape or status transitions. When
 * we later add an auto-complete button, this feature gets replaced
 * wholesale; nothing in the page or backend has to follow along.
 */
export function PublishDialog({ prdId, productId }: PublishDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [rawResponse, setRawResponse] = useState("");

  const submitMutation = useMutation(
    trpc.product.prd.completion.submit.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.product.prd.get.queryKey({ id: prdId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.product.prd.list.queryKey({ productId }),
        });
        setOpen(false);
      },
    }),
  );

  const handleConfirm = () => {
    submitMutation.mutate({ id: prdId, rawResponse });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setRawResponse("");
          submitMutation.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <Send className="size-4" />
          발행하기
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>PRD 발행</DialogTitle>
          <DialogDescription>
            AI 응답을 통째로 아래에 붙여넣어주세요. 서버가 markdown 코드블록을
            추출해 저장합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <Label htmlFor="publish-md">LLM 응답</Label>
          <Textarea
            id="publish-md"
            value={rawResponse}
            onChange={(e) => setRawResponse(e.target.value)}
            placeholder="여기에 LLM이 완성한 응답을 그대로 붙여넣으세요"
            className="min-h-50 flex-1 resize-none font-mono text-xs"
            autoFocus
          />
          {submitMutation.error && (
            <p className="text-sm text-destructive">{submitMutation.error.message}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitMutation.isPending}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitMutation.isPending || rawResponse.trim().length === 0}
          >
            {submitMutation.isPending ? "발행 중..." : "발행"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
