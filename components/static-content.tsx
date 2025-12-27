"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect } from "react";

import { getMarlinExtensions } from "@/components/editor/extensions";
import { cn } from "@/lib/utils";

interface StaticContentProps {
  content: string;
}

export function StaticContent({ content }: StaticContentProps) {
  const extensions = getMarlinExtensions({
    isExpanded: false,
    placeholder: "",
  });

  const editor = useEditor({
    editable: false,
    extensions: extensions,
    content: content,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-zinc dark:prose-invert max-w-none text-base focus:outline-none",
          "prose-p:my-4 prose-headings:mb-4 prose-headings:mt-12 prose-headings:first:mt-0",
          "prose-h1:text-3xl prose-h1:font-bold prose-h1:tracking-tight prose-h1:mb-2",
          "prose-h2:text-2xl prose-h2:font-semibold prose-h2:text-white",
          "prose-h3:text-xl prose-h3:font-medium prose-h3:text-zinc-200",
          "prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-ul:marker:text-zinc-600 prose-ul:mb-4",
          "prose-li:text-zinc-300",
          "prose-strong:font-semibold prose-strong:text-white",
          "prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-zinc-800 prose-code:text-zinc-200 prose-code:text-sm prose-code:font-mono",
          "prose-a:text-indigo-400 prose-a:hover:text-indigo-300 prose-a:underline prose-a:underline-offset-4",
          "text-lg leading-relaxed text-zinc-300"
        ),
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.storage.markdown?.getMarkdown()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return <EditorContent editor={editor} />;
}
