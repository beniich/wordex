"use client";

import { type Editor } from "@tiptap/react";
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Undo2, Redo2, Sparkles, Download,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
  onAskAI?: () => void;
  onExport?: (format: "pdf" | "docx" | "pptx" | "markdown") => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={[
        "w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 text-sm",
        active ? "bg-indigo-600/40 text-indigo-400" : "text-slate-400 hover:bg-white/10 hover:text-white",
        disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-white/10 mx-1 self-center" />;
}

export default function EditorToolbar({ editor, onAskAI, onExport }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="h-12 border-b border-white/10 flex items-center px-3 gap-0.5 bg-slate-900/80 flex-wrap">
      {/* History */}
      <ToolbarButton
        title="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 size={15} />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={15} />
      </ToolbarButton>

      <Divider />

      {/* Inline Marks */}
      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Inline Code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={15} />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        title="Bullet List"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Ordered List"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Horizontal Rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={15} />
      </ToolbarButton>

      <Divider />

      {/* AI + Export */}
      <button
        onClick={onAskAI}
        title="Ask AI"
        aria-label="Ask AI"
        className="h-8 px-3 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 text-xs font-semibold flex items-center gap-1.5 transition-colors ml-1"
      >
        <Sparkles size={13} />
        Ask AI
      </button>

      {onExport && (
        <div className="relative group ml-1">
          <button
            className="h-8 px-3 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Export"
            aria-label="Export document"
          >
            <Download size={13} />
            Export
          </button>
          <div className="absolute left-0 top-full mt-1 w-36 glass-panel py-1 hidden group-hover:block z-50 shadow-xl">
            {(["pdf", "docx", "pptx", "markdown"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => onExport(fmt)}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wide"
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
