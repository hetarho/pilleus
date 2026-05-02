"use client";

import { useState } from "react";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { composeContent, extractAnswers, PRD_SECTIONS } from "@/entities/prd";

interface PrdFormViewProps {
  /** Current PRD markdown body. */
  content: string;
  /** Called with the updated markdown after every keystroke. */
  onChange: (next: string) => void;
}

/** Form-style PRD editor — one textarea per ✏️ section, ✏️ instruction shown
 * as the question, 🤖 instruction hidden (it's only for the LLM). The full
 * markdown is reconstructed (boilerplate + answers) on every change so the
 * editor view sees the same content. */
export function PrdFormView({ content, onChange }: PrdFormViewProps) {
  /* Initialize from `content` once on mount. We don't re-derive answers from
   * `content` on every render because the parent's `content` is updated by
   * THIS component on every keystroke — re-deriving would create a feedback
   * loop and risk losing in-progress edits to whitespace re-serialization. */
  const [answers, setAnswers] = useState<string[]>(() => extractAnswers(content));

  const update = (i: number, value: string) => {
    const next = [...answers];
    next[i] = value;
    setAnswers(next);
    onChange(composeContent(next));
  };

  return (
    <div className="flex flex-col gap-6">
      {PRD_SECTIONS.map((sec, i) => (
        <section key={sec.index} className="flex flex-col gap-2 rounded-lg bg-card p-5">
          <h3 className="text-base font-semibold">{sec.title}</h3>
          <Label
            htmlFor={`prd-form-${sec.index}`}
            className="text-sm font-normal text-muted-foreground leading-relaxed whitespace-pre-wrap"
          >
            {sec.humanInstructionDisplay}
          </Label>
          <Textarea
            id={`prd-form-${sec.index}`}
            value={answers[i] ?? ""}
            onChange={(e) => update(i, e.target.value)}
            placeholder="여기에 작성"
            rows={sec.index === 5 ? 10 : 4}
          />
        </section>
      ))}
    </div>
  );
}
