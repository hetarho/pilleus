"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { useTRPC } from "@/shared/api/trpc/client";
import {
  getSectionLabel,
  getSectionsFor,
  type PolicyCategory,
} from "@/entities/policy";
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
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

interface PolicyEditDialogProps {
  productId: string;
  category: PolicyCategory;
  /** Initial section for new policies. Required for design/ux; null for etc. */
  section: string | null;
  trigger: ReactNode;
  /** Existing policy — switches the dialog into edit mode. */
  policy?: {
    id: string;
    section: string | null;
    title: string;
    body: string;
  };
}

export function PolicyEditDialog({
  productId,
  category,
  section,
  trigger,
  policy,
}: PolicyEditDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = policy !== undefined;
  const sections = getSectionsFor(category);
  const isEtc = category === "etc";

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [currentSection, setCurrentSection] = useState<string | null>(section);

  useEffect(() => {
    if (!open) return;
    setTitle(policy?.title ?? "");
    setBody(policy?.body ?? "");
    setCurrentSection(policy?.section ?? section);
  }, [open, policy, section]);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.policy.list.queryKey({ productId }),
    });

  const createMutation = useMutation(
    trpc.policy.create.mutationOptions({
      onSuccess: () => {
        invalidate();
        setOpen(false);
      },
    }),
  );
  const updateMutation = useMutation(
    trpc.policy.update.mutationOptions({
      onSuccess: () => {
        invalidate();
        setOpen(false);
      },
    }),
  );

  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSubmit =
    !isPending && title.trim().length > 0 && (isEtc || currentSection !== null);

  const sectionLabel = currentSection
    ? getSectionLabel(category, currentSection)
    : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit policy" : isEtc ? "New policy" : `New ${sectionLabel} policy`}
          </DialogTitle>
          <DialogDescription>
            {isEtc
              ? "Product 전반의 자유 정책 — 인증·데이터 보존·결제 등."
              : "이 섹션에 적용되는 규칙·원칙·금지 사항을 짧고 명확하게 적어주세요."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            const trimmedTitle = title.trim();
            if (isEdit && policy) {
              updateMutation.mutate({
                id: policy.id,
                title: trimmedTitle,
                body,
                section: isEtc ? null : currentSection,
              });
            } else {
              createMutation.mutate({
                productId,
                category,
                section: isEtc ? null : currentSection,
                title: trimmedTitle,
                body,
              });
            }
          }}
        >
          {!isEtc && sections.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="policy-section">Section</Label>
              <select
                id="policy-section"
                value={currentSection ?? ""}
                onChange={(e) => setCurrentSection(e.target.value || null)}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="policy-title">Title</Label>
            <Input
              id="policy-title"
              autoFocus
              placeholder={
                category === "etc"
                  ? "예: 비로그인 사용자는 결제 페이지 접근 불가"
                  : "한 문장으로 정리한 규칙"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="policy-body">Body (optional)</Label>
            <Textarea
              id="policy-body"
              placeholder="배경·예외·예시 등 상세 설명. markdown 사용 가능."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-32 max-h-[40vh] resize-none text-sm"
            />
          </div>

          {(createMutation.error || updateMutation.error) && (
            <p className="text-sm text-destructive">
              {createMutation.error?.message ?? updateMutation.error?.message}
            </p>
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending ? "Saving..." : isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
