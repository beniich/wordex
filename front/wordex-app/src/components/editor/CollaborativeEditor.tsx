"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useCallback, forwardRef, useImperativeHandle } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CollaborativeEditorRef {
  getContent: () => unknown;
  getText: () => string;
  setContent: (content: unknown) => void;
  clearContent: () => void;
}

interface CollaborativeEditorProps {
  initialContent?: unknown;
  editable?: boolean;
  onUpdate?: (json: unknown, text: string) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const CollaborativeEditor = forwardRef<CollaborativeEditorRef, CollaborativeEditorProps>(
  ({ initialContent, editable = true, onUpdate, className = "" }, ref) => {

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading:       { levels: [1, 2, 3] },
          blockquote:    {},
          bulletList:    {},
          orderedList:   {},
          codeBlock:     {},
          horizontalRule: {},
        }),
      ],
      content: (initialContent as string) ?? "",
      editable,
      editorProps: {
        attributes: {
          class: [
            "prose prose-invert max-w-none focus:outline-none",
            "text-slate-300 leading-relaxed",
            "min-h-[400px] px-2 py-1",
          ].join(" "),
        },
      },
      onUpdate: ({ editor }) => {
        onUpdate?.(editor.getJSON(), editor.getText());
      },
    });

    // Expose imperative API to parent
    useImperativeHandle(ref, () => ({
      getContent: () => editor?.getJSON() ?? null,
      getText:    () => editor?.getText() ?? "",
      setContent: (c: unknown) => editor?.commands.setContent(c as string),
      clearContent: () => editor?.commands.clearContent(),
    }));

    // Update content when prop changes (e.g., loading a different doc)
    useEffect(() => {
      if (!editor || !initialContent) return;
      const current = JSON.stringify(editor.getJSON());
      const incoming = JSON.stringify(initialContent);
      if (current !== incoming) {
        editor.commands.setContent(initialContent as string);
      }
    }, [editor, initialContent]);

    // Toggle editable
    useEffect(() => {
      editor?.setEditable(editable);
    }, [editor, editable]);

    if (!editor) return null;

    return (
      <div className={`relative ${className}`}>
        <EditorContent editor={editor} />
      </div>
    );
  }
);

CollaborativeEditor.displayName = "CollaborativeEditor";
export default CollaborativeEditor;
