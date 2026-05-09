"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { cn } from "@/shared/lib";
import { buildDiffRows } from "../lib/diff-rows";

interface VersionCompareDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Left side label (e.g., "v3"). */
  leftLabel: string;
  leftContent: string;
  /** Right side label (e.g., "현재"). */
  rightLabel: string;
  rightContent: string;
}

/** Full-screen-ish dialog showing a line-aligned diff between two PRD bodies.
 *
 * Layout: each diff row is one flex container that holds left + right
 * cells. We used to lay this out via `grid grid-cols-2` with auto-placement
 * but that produced overlapping text on long Korean lines once cells
 * wrapped to very different heights — the grid row height tracked the
 * tallest cell but the cells themselves rendered with their own intrinsic
 * heights, which on overflow drew on top of the next row. Per-row flex
 * containers give each diff row its own block, so wrapping never bleeds
 * into the next pair. */
export function VersionCompareDialog({
  open,
  onOpenChange,
  leftLabel,
  leftContent,
  rightLabel,
  rightContent,
}: VersionCompareDialogProps) {
  const rows = useMemo(
    () => buildDiffRows(leftContent, rightContent),
    [leftContent, rightContent],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-6xl flex-col gap-4 sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>버전 비교</DialogTitle>
          <DialogDescription>
            {leftLabel} 와 {rightLabel} 사이의 변경 사항입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-card">
          <div className="flex border-b text-xs font-semibold text-muted-foreground">
            <div className="flex-1 px-3 py-1.5">{leftLabel}</div>
            <div className="flex-1 border-l px-3 py-1.5">{rightLabel}</div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto font-mono text-xs leading-relaxed">
            {rows.length === 0 ? (
              <div className="px-3 py-4 text-center text-muted-foreground">
                두 버전이 동일합니다.
              </div>
            ) : (
              rows.map((row, i) => (
                <div key={i} className="flex items-stretch">
                  <div
                    className={cn(
                      "min-w-0 flex-1 whitespace-pre-wrap wrap-break-word px-3 py-0.5",
                      row.status === "removed" &&
                        "bg-red-500/15 text-red-700 dark:text-red-300",
                    )}
                  >
                    {row.left ?? " "}
                  </div>
                  <div
                    className={cn(
                      "min-w-0 flex-1 whitespace-pre-wrap wrap-break-word border-l px-3 py-0.5",
                      row.status === "added" &&
                        "bg-green-500/15 text-green-700 dark:text-green-300",
                    )}
                  >
                    {row.right ?? " "}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
