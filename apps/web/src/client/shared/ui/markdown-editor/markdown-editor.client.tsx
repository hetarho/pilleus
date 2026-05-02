"use client";

import "@mdxeditor/editor/style.css";
import "./markdown-editor.css";

import {
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  ListsToggle,
  CodeToggle,
  InsertCodeBlock,
  InsertThematicBreak,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";

interface MarkdownEditorProps {
  markdown: string;
  onChange: (md: string) => void;
  readOnly?: boolean;
}

export default function MarkdownEditorClient({
  markdown,
  onChange,
  readOnly = false,
}: MarkdownEditorProps) {
  /* In readOnly mode we drop the toolbar plugin entirely so the rendered
   * markdown reads as a clean document (no disabled-button strip on top).
   * Editing affordances re-appear when the host swaps to edit mode. */
  const plugins = [
    headingsPlugin(),
    listsPlugin(),
    quotePlugin(),
    thematicBreakPlugin(),
    linkPlugin(),
    linkDialogPlugin(),
    markdownShortcutPlugin(),
    codeBlockPlugin({ defaultCodeBlockLanguage: "ts" }),
    codeMirrorPlugin({
      codeBlockLanguages: { ts: "TypeScript", js: "JavaScript", bash: "Shell", "": "Plain" },
    }),
    ...(readOnly
      ? []
      : [
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <BlockTypeSelect />
                <ListsToggle />
                <CreateLink />
                <InsertCodeBlock />
                <InsertThematicBreak />
              </>
            ),
          }),
        ]),
  ];

  return (
    <MDXEditor
      markdown={markdown}
      onChange={onChange}
      readOnly={readOnly}
      contentEditableClassName="max-w-none p-4 min-h-[60vh] focus:outline-none"
      plugins={plugins}
    />
  );
}
