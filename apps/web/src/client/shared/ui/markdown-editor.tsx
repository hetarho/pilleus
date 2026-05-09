"use client";

interface MarkdownEditorProps {
  markdown: string;
  onChange: (md: string) => void;
  readOnly?: boolean;
}

export function MarkdownEditor({ markdown, onChange, readOnly = false }: MarkdownEditorProps) {
  return (
    <div className="flex w-full">
      <textarea
        value={markdown}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        className="min-h-[60vh] flex-1 resize-y bg-card font-mono text-sm leading-6 text-foreground outline-none"
      />
    </div>
  );
}
