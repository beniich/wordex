"use client";

import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { ai as aiAPI } from "@/lib/api";
import { useState } from "react";

interface AIBubbleMenuProps {
  editor: Editor;
}

export default function AIBubbleMenu({ editor }: AIBubbleMenuProps) {
  const [loading, setLoading] = useState(false);

  const handleAIAction = async (prompt: string) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText) return;

    setLoading(true);
    try {
      const response = await aiAPI.chat([
        { role: "system", content: "You are an expert editor. Rewrite or improve the following text based on the user prompt. Return only the improved text." },
        { role: "user", content: `Prompt: ${prompt}\n\nText: ${selectedText}` }
      ], "editor");

      editor.chain().focus().insertContent(response.response).run();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-1 bg-inverse-surface p-1.5 rounded-2xl shadow-2xl border border-white/5 backdrop-blur-2xl"
    >
      <button
        onClick={() => handleAIAction("Summarize this text")}
        disabled={loading}
        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-surface hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
      >
        Summarize
      </button>
      <button
        onClick={() => handleAIAction("Fix grammar and spelling")}
        disabled={loading}
        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
      >
        Fix Grammar
      </button>
      <button
        onClick={() => handleAIAction("Make it more professional")}
        disabled={loading}
        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
      >
        Rewrite
      </button>
      
      <div className="w-px h-4 bg-white/10 mx-1" />
      
      <div className="flex items-center gap-1 px-2">
         {loading ? (
           <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
         ) : (
           <span className="material-symbols-outlined text-[16px] text-white/50">auto_awesome</span>
         )}
      </div>
    </BubbleMenu>
  );
}
