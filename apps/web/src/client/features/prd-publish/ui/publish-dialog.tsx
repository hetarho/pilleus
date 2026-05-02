"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

interface PublishDialogProps {
  /** Called when the user confirms — host updates content + status. */
  onPublish: (markdown: string) => void;
  isPending?: boolean;
}

/** "발행하기" dialog. The author has copied the prompt, completed the PRD
 * with an external LLM, and now pastes the resulting markdown here. The
 * textarea always starts empty — the workflow is always paste-from-LLM,
 * pre-filling with the draft body would only get in the way. */
export function PublishDialog({ onPublish, isPending }: PublishDialogProps) {
  const [open, setOpen] = useState(false);
  const [markdown, setMarkdown] = useState("");

  const handleConfirm = () => {
    onPublish(markdown);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Always reset on open so the previous paste doesn't linger
        if (next) setMarkdown("");
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
            AI와 함께 완성한 markdown을 아래에 붙여넣어주세요. 발행 후에는 markdown
            에디터에서 직접 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <Label htmlFor="publish-md">완성된 markdown</Label>
          <Textarea
            id="publish-md"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="여기에 LLM이 완성한 markdown을 붙여넣으세요"
            className="min-h-50 flex-1 resize-none font-mono text-xs"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || markdown.trim().length === 0}
          >
            {isPending ? "발행 중..." : "발행"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
