import { diffLines } from "diff";

export type DiffStatus = "same" | "added" | "removed";

export interface DiffRow {
  /** Left-side line. null when this row exists only on the right (added). */
  left: string | null;
  /** Right-side line. null when this row exists only on the left (removed). */
  right: string | null;
  status: DiffStatus;
}

/** Compute a line-aligned, git-diff-style row list from two markdown blobs.
 * Unchanged lines show on both sides; additions on the right only; removals
 * on the left only — mirroring `git diff --side-by-side`. */
export function buildDiffRows(left: string, right: string): DiffRow[] {
  const changes = diffLines(left, right);
  const rows: DiffRow[] = [];
  for (const change of changes) {
    /* `diff` emits chunks whose `value` ends with the trailing newline of
     * the last line; splitting on \n leaves an empty trailing element we
     * want to drop. */
    const lines = change.value.split("\n");
    if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
    if (change.added) {
      for (const line of lines) rows.push({ left: null, right: line, status: "added" });
    } else if (change.removed) {
      for (const line of lines) rows.push({ left: line, right: null, status: "removed" });
    } else {
      for (const line of lines) rows.push({ left: line, right: line, status: "same" });
    }
  }
  return rows;
}
