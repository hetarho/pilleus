"use client";

import "@mdxeditor/editor/style.css";

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
  return (
    <MDXEditor
      markdown={markdown}
      onChange={onChange}
      readOnly={readOnly}
      contentEditableClassName="prose max-w-none p-4 min-h-[60vh] focus:outline-none"
      plugins={[
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
      ]}
    />
  );
}
