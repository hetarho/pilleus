"use client";

import { Fragment, useMemo } from "react";
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
 * Layout: side-by-side grid, removed rows tinted red on the left, added rows
 * green on the right, unchanged rows neutral on both. Both sides are
 * read-only — comparing past states is the use case here, not editing. */
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
          <div className="grid grid-cols-2 border-b text-xs font-semibold text-muted-foreground">
            <div className="px-3 py-1.5">{leftLabel}</div>
            <div className="border-l px-3 py-1.5">{rightLabel}</div>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2 overflow-y-auto font-mono text-xs leading-relaxed">
            {rows.length === 0 ? (
              <div className="col-span-2 px-3 py-4 text-center text-muted-foreground">
                두 버전이 동일합니다.
              </div>
            ) : (
              rows.map((row, i) => (
                <Fragment key={i}>
                  <div
                    className={cn(
                      "min-h-[1.5em] whitespace-pre-wrap break-all px-3 py-0.5",
                      row.status === "removed" &&
                        "bg-red-500/15 text-red-700 dark:text-red-300",
                    )}
                  >
                    {row.left ?? " "}
                  </div>
                  <div
                    className={cn(
                      "min-h-[1.5em] whitespace-pre-wrap break-all border-l px-3 py-0.5",
                      row.status === "added" &&
                        "bg-green-500/15 text-green-700 dark:text-green-300",
                    )}
                  >
                    {row.right ?? " "}
                  </div>
                </Fragment>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
