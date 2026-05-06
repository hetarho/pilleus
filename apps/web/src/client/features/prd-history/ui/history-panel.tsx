"use client";

import { ArrowLeft, GitCompare, History, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { Button } from "@/shared/ui/button";
import { MarkdownRenderer } from "@/shared/ui/markdown-renderer";
import { useTRPC } from "@/shared/api/trpc/client";
import { cn } from "@/shared/lib";
import { VersionCompareDialog } from "./version-compare-dialog";

interface HistoryPanelProps {
  prdId: string;
  /** Current (live) PRD body — diffed against any past version the user
   * picks to compare. */
  currentContent: string;
  /** Optional callback when user restores a past version. Host updates the
   * PRD content state; persistence happens through the regular Save flow. */
  onRestore?: (content: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "초안",
  published: "발행",
  ai_reviewed: "AI 리뷰",
};

const formatTimestamp = (d: Date): string => {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Right-side history panel. Lists versions newest first; clicking a row
 * loads that version's full content for inline viewing. From the detail
 * view the user can compare against the current content (opens a separate
 * dialog) or restore (callback to the host). */
export function HistoryPanel({ prdId, currentContent, onRestore }: HistoryPanelProps) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  /* List loads when the panel opens; per-version content loads on selection.
   * `enabled` gates both so we don't fetch unnecessary data on every detail
   * page render. */
  const listQuery = useQuery({
    ...trpc.product.prd.versions.list.queryOptions({ prdId }),
    enabled: open,
  });

  const detailQuery = useQuery({
    ...trpc.product.prd.versions.get.queryOptions({ id: selectedId ?? "" }),
    enabled: open && selectedId !== null,
  });

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) setSelectedId(null);
  };

  const handleRestore = () => {
    if (!detailQuery.data || !onRestore) return;
    onRestore(detailQuery.data.content);
    setOpen(false);
    setSelectedId(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <History className="size-4" />
            히스토리
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b">
            <SheetTitle>히스토리</SheetTitle>
            <SheetDescription>
              {selectedId
                ? "선택한 버전을 보고 있습니다. 비교하거나 복원할 수 있어요."
                : "이 PRD가 저장된 모든 시점입니다. 클릭하면 해당 버전을 볼 수 있어요."}
            </SheetDescription>
          </SheetHeader>

          {selectedId === null ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {listQuery.isPending && (
                <p className="p-6 text-sm text-muted-foreground">불러오는 중...</p>
              )}
              {listQuery.error && (
                <p className="p-6 text-sm text-destructive">
                  {listQuery.error.message}
                </p>
              )}
              {listQuery.data && listQuery.data.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground">
                  버전이 없습니다.
                </p>
              )}
              {listQuery.data?.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className="flex flex-col items-start gap-1 border-b p-4 text-left transition-colors hover:bg-muted cursor-pointer"
                >
                  <div className="flex w-full items-center gap-2">
                    <span className="text-sm font-semibold">v{v.version}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        v.status === "draft" && "bg-muted text-muted-foreground",
                        v.status === "published" && "bg-primary/15 text-primary",
                        v.status === "ai_reviewed" && "bg-accent text-accent-foreground",
                      )}
                    >
                      {STATUS_LABEL[v.status] ?? v.status}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatTimestamp(v.createdAt)}
                    </span>
                  </div>
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {v.title}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center gap-2 border-b p-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedId(null)}
                >
                  <ArrowLeft className="size-4" />
                  목록으로
                </Button>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCompareOpen(true)}
                    disabled={!detailQuery.data}
                  >
                    <GitCompare className="size-4" />
                    현재와 비교
                  </Button>
                  {onRestore && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRestore}
                      disabled={!detailQuery.data}
                    >
                      <RotateCcw className="size-4" />
                      이 버전으로 복원
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
                {detailQuery.isPending && (
                  <p className="text-sm text-muted-foreground">불러오는 중...</p>
                )}
                {detailQuery.error && (
                  <p className="text-sm text-destructive">{detailQuery.error.message}</p>
                )}
                {detailQuery.data && (
                  <>
                    <div className="mb-4 text-xs text-muted-foreground">
                      v{detailQuery.data.version} · {formatTimestamp(detailQuery.data.createdAt)}
                    </div>
                    <MarkdownRenderer markdown={detailQuery.data.content} />
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {detailQuery.data && (
        <VersionCompareDialog
          open={compareOpen}
          onOpenChange={setCompareOpen}
          leftLabel={`v${detailQuery.data.version}`}
          leftContent={detailQuery.data.content}
          rightLabel="현재"
          rightContent={currentContent}
        />
      )}
    </>
  );
}
