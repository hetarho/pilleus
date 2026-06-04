"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface RowItem {
  id: string;
  label: string;
}

/** Inline CRUD list backed by real rows: add via the bottom input, edit a row
 * by blurring after a change, delete with the X. Shared by the Persona and
 * Benefit sections of the Intent ring. */
export function RowListEditor({
  items,
  placeholder,
  onAdd,
  onUpdate,
  onDelete,
}: {
  items: RowItem[];
  placeholder: string;
  onAdd: (label: string) => void;
  onUpdate: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <EditableRow
          key={item.id}
          item={item}
          placeholder={placeholder}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" size="sm" onClick={add} className="shrink-0">
          <Plus className="size-4" /> Add
        </Button>
      </div>
    </div>
  );
}

function EditableRow({
  item,
  placeholder,
  onUpdate,
  onDelete,
}: {
  item: RowItem;
  placeholder: string;
  onUpdate: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}) {
  const [value, setValue] = useState(item.label);
  useEffect(() => setValue(item.label), [item.label]);

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          const v = value.trim();
          if (v && v !== item.label) onUpdate(item.id, v);
          else if (!v) setValue(item.label);
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDelete(item.id)}
        aria-label="Remove item"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
