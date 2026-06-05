"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, Copy, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTRPC } from "@/shared/api/trpc/client";
import {
  type TokenGroup,
  TOKEN_GROUP_LABELS,
  TOKEN_GROUPS,
} from "@/entities/design-token";
import {
  ModelPicker,
  useLlmCatalogQuery,
  type LlmModelSelection,
} from "@/entities/llm";
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
import { cn } from "@/shared/lib";

type Density = "minimal" | "balanced" | "comprehensive";

const DENSITY_OPTIONS: { value: Density; label: string; hint: string }[] = [
  { value: "minimal", label: "적게", hint: "각 그룹 3~5개" },
  { value: "balanced", label: "보통", hint: "각 그룹 6~10개" },
  { value: "comprehensive", label: "다양하게", hint: "각 그룹 12~20개" },
];

interface TokenGenerationDialogProps {
  productId: string;
  /** Pass a group to generate just that group's tokens. Omit to generate
   * tokens for all 5 groups in a single LLM round-trip. */
  group?: TokenGroup;
  trigger?: ReactNode;
}

/**
 * Single dialog covering both "per-group" and "all-groups" generation.
 *
 * Manual flow:
 *   1. density 선택
 *   2. 프롬프트 복사 (buildPrompt query → clipboard)
 *   3. 외부 LLM에서 실행 → 응답 붙여넣기
 *   4. 적용 (submit mutation → 그룹별 append)
 *
 * 백엔드에 provider가 붙으면 이 dialog가 한 번에 끝나는 버튼으로
 * 교체되는 자리. 거기까지 가도 task / use case / 저장 경로는 그대로.
 */
export function TokenGenerationDialog({
  productId,
  group,
  trigger,
}: TokenGenerationDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isAll = group === undefined;

  /* Color tokens MUST anchor to an existing palette; without one, the
   * server will reject the response anyway. Surface the constraint up
   * front instead of letting the user run an LLM and hit an error. */
  const palettesQuery = useQuery(
    trpc.design.palette.list.queryOptions({ productId }),
  );
  const paletteCount = palettesQuery.data?.length ?? 0;
  const colorBlocked = !isAll && group === "color" && paletteCount === 0;
  const allModeWarnsNoColor = isAll && paletteCount === 0;

  const [open, setOpen] = useState(false);
  const [density, setDensity] = useState<Density>("balanced");
  const [selection, setSelection] = useState<LlmModelSelection | null>(null);
  const [rawResponse, setRawResponse] = useState("");

  /* Availability hint for the server-run block. Same query the picker uses
   * (react-query dedupes), so this is free. */
  const catalogQuery = useLlmCatalogQuery();
  const anyAvailable = (catalogQuery.data ?? []).some((p) => p.available);
  const [copyState, setCopyState] = useState<"idle" | "loading" | "copied" | "error">(
    "idle",
  );
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (open) return;
    setRawResponse("");
    setCopyState("idle");
    setCopyError(null);
  }, [open]);

  useEffect(() => {
    if (copyState !== "copied") return;
    const t = setTimeout(() => setCopyState("idle"), 2000);
    return () => clearTimeout(t);
  }, [copyState]);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.design.token.list.queryKey({ productId }),
    });

  const submitGroup = useMutation(
    trpc.design.token.generation.submit.mutationOptions({
      onSuccess: () => {
        invalidate();
        setOpen(false);
      },
    }),
  );
  const submitAll = useMutation(
    trpc.design.token.generation.allSubmit.mutationOptions({
      onSuccess: () => {
        invalidate();
        setOpen(false);
      },
    }),
  );

  const submitMutation = isAll ? submitAll : submitGroup;

  /* Server-run path: one click → server resolves the provider from the
   * user's key, calls the model, parses + persists. Same write path as the
   * manual submit. */
  const runGroup = useMutation(
    trpc.design.token.generation.run.mutationOptions({
      onSuccess: () => {
        invalidate();
        setOpen(false);
      },
    }),
  );
  const runAll = useMutation(
    trpc.design.token.generation.allRun.mutationOptions({
      onSuccess: () => {
        invalidate();
        setOpen(false);
      },
    }),
  );
  const runMutation = isAll ? runAll : runGroup;

  const handleRun = () => {
    if (!selection) return;
    if (isAll) {
      runAll.mutate({
        productId,
        density,
        providerId: selection.providerId,
        modelId: selection.modelId,
      });
    } else {
      runGroup.mutate({
        productId,
        group,
        density,
        providerId: selection.providerId,
        modelId: selection.modelId,
      });
    }
  };

  const handleCopy = async () => {
    setCopyState("loading");
    setCopyError(null);
    try {
      const prompt = isAll
        ? await queryClient.fetchQuery(
            trpc.design.token.generation.allBuildPrompt.queryOptions({
              productId,
              density,
            }),
          )
        : await queryClient.fetchQuery(
            trpc.design.token.generation.buildPrompt.queryOptions({
              productId,
              group,
              density,
            }),
          );
      await navigator.clipboard.writeText(`${prompt.system}\n\n${prompt.user}`);
      setCopyState("copied");
    } catch (e) {
      setCopyState("error");
      setCopyError(e instanceof Error ? e.message : "프롬프트 생성에 실패했습니다.");
    }
  };

  const handleSubmit = () => {
    if (isAll) {
      submitAll.mutate({ productId, density, rawResponse });
    } else {
      submitGroup.mutate({ productId, group, density, rawResponse });
    }
  };

  /* Combine per-group skipped names for display when in all-mode. */
  const skippedDisplay = (() => {
    if (isAll) {
      const data = submitAll.data;
      if (!data) return null;
      const lines = TOKEN_GROUPS.flatMap((g) =>
        data.skippedByGroup[g].length > 0 ? [`${g}: ${data.skippedByGroup[g].join(", ")}`] : [],
      );
      return lines.length > 0 ? lines : null;
    }
    const data = submitGroup.data;
    if (!data) return null;
    return data.skipped.length > 0 ? [data.skipped.join(", ")] : null;
  })();

  const title = isAll
    ? "전체 토큰 AI 생성"
    : `${TOKEN_GROUP_LABELS[group]} AI 생성`;
  const description = isAll
    ? "Product overview를 바탕으로 5개 그룹의 토큰을 한 번에 생성합니다. 갯수를 고르고 프롬프트를 복사해 LLM에 붙여넣은 뒤, 응답(JSON 코드블록)을 그대로 붙여넣어주세요."
    : "Product overview를 바탕으로 토큰을 생성합니다. 갯수를 고르고 프롬프트를 복사한 뒤, 외부 LLM의 응답(JSON 코드블록)을 그대로 붙여넣어주세요.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant={isAll ? "default" : "outline"}>
            <Sparkles className="size-4" />
            {isAll ? "전체 AI 생성" : "AI 생성"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {colorBlocked ? (
          <div className="flex items-start gap-2 rounded-md border border-dashed bg-card/50 p-4 text-sm text-muted-foreground">
            <AlertCircle className="size-4 shrink-0 text-amber-500" />
            <p>
              색상 토큰은 팔레트의 step을 가리키는 별칭이라 팔레트가 먼저
              필요합니다. 위쪽 <strong>Palettes</strong> 섹션에서 팔레트를
              한 개 이상 만든 뒤 다시 시도해주세요.
            </p>
          </div>
        ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <Label>토큰 갯수</Label>
            <div className="flex gap-2">
              {DENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDensity(opt.value)}
                  className={cn(
                    "flex flex-1 flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm transition",
                    density === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-input hover:bg-accent",
                  )}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {allModeWarnsNoColor && (
            <div className="flex items-start gap-2 rounded-md border border-dashed bg-card/50 p-3 text-xs text-muted-foreground">
              <AlertCircle className="size-4 shrink-0 text-amber-500" />
              <p>
                팔레트가 없어 <strong>color 그룹은 비어있는 상태</strong>로
                생성됩니다. color 토큰까지 생성하려면 먼저 팔레트를 만들어주세요.
              </p>
            </div>
          )}

          {/* 방법 1 — 서버가 연결된 키로 직접 모델 호출 (one-click). */}
          <div className="flex flex-col gap-2 rounded-md border bg-card/40 p-3">
            <Label className="text-sm font-medium">방법 1 · 서버에서 바로 생성</Label>
            <p className="text-xs text-muted-foreground">
              연결된 API 키로 서버가 직접 모델을 호출해 토큰을 만들어 저장합니다.
            </p>
            <div className="flex items-center gap-2">
              <ModelPicker
                value={selection}
                onChange={setSelection}
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                onClick={handleRun}
                disabled={!selection || runMutation.isPending}
              >
                {runMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {runMutation.isPending ? "생성 중..." : "생성"}
              </Button>
            </div>
            {!anyAvailable && !catalogQuery.isLoading && (
              <p className="text-xs text-muted-foreground">
                연결된 API 키가 없습니다. 아래 <strong>방법 2</strong>(프롬프트 복사)를
                사용하거나, 내 정보 관리에서 키를 연결하세요.
              </p>
            )}
            {runMutation.error && (
              <p className="text-sm text-destructive">{runMutation.error.message}</p>
            )}
          </div>

          {/* 방법 2 — 프롬프트 복사 → 외부 LLM 실행 → 응답 붙여넣기 (BYOK 없이도 동작). */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="gen-response">방법 2 · 직접 실행 후 붙여넣기</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                disabled={copyState === "loading"}
              >
                {copyState === "loading" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : copyState === "copied" ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copyState === "loading"
                  ? "준비 중..."
                  : copyState === "copied"
                    ? "복사됨"
                    : "프롬프트 복사"}
              </Button>
              {copyError && (
                <span className="self-center text-sm text-destructive">{copyError}</span>
              )}
            </div>
            <Textarea
              id="gen-response"
              value={rawResponse}
              onChange={(e) => setRawResponse(e.target.value)}
              placeholder="여기에 LLM이 반환한 응답 전체를 붙여넣으세요. (```json 블록 포함)"
              className="min-h-40 max-h-[40vh] resize-none overflow-y-auto font-mono text-xs"
            />
            {submitMutation.error && (
              <p className="text-sm text-destructive">{submitMutation.error.message}</p>
            )}
            {skippedDisplay && (
              <div className="text-xs text-muted-foreground">
                <p className="mb-1">이미 존재하는 이름이라 건너뛴 토큰:</p>
                <ul className="list-disc pl-4">
                  {skippedDisplay.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitMutation.isPending}
          >
            {colorBlocked ? "닫기" : "취소"}
          </Button>
          {!colorBlocked && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || rawResponse.trim().length === 0}
            >
              {submitMutation.isPending ? "적용 중..." : "적용"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
