import { useCallback, useId, useRef, useState } from "react";

export interface StringListRow {
  id: string;
  value: string;
}

export interface StringList {
  rows: readonly StringListRow[];
  values: string[];
  setValue: (id: string, value: string) => void;
  add: () => void;
  remove: (id: string) => void;
  reset: (values: string[]) => void;
}

/**
 * Editable list-of-strings with stable row keys. Owns keyed rows internally so
 * React reconciles by identity (not array index — which makes controlled
 * inputs shift focus/value on insert-remove), while exposing the plain
 * `string[]` callers actually persist. An empty list always keeps one blank row.
 */
export function useStringList(): StringList {
  const prefix = useId();
  const counter = useRef(0);
  const nextId = useCallback(() => `${prefix}-${counter.current++}`, [prefix]);

  const toRows = useCallback(
    (values: string[]): StringListRow[] =>
      (values.length > 0 ? values : [""]).map((value) => ({ id: nextId(), value })),
    [nextId],
  );

  const [rows, setRows] = useState<StringListRow[]>(() => toRows([]));

  const setValue = useCallback((id: string, value: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, value } : r)));
  }, []);

  const add = useCallback(() => {
    setRows((rs) => [...rs, { id: nextId(), value: "" }]);
  }, [nextId]);

  const remove = useCallback(
    (id: string) => {
      setRows((rs) => {
        const next = rs.filter((r) => r.id !== id);
        return next.length > 0 ? next : [{ id: nextId(), value: "" }];
      });
    },
    [nextId],
  );

  const reset = useCallback((values: string[]) => setRows(toRows(values)), [toRows]);

  return { rows, values: rows.map((r) => r.value), setValue, add, remove, reset };
}
