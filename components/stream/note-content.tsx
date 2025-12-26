import { Editor, Mark, mergeAttributes } from "@tiptap/core";
import { useMemo } from "react";

import { getMarlinExtensions } from "@/components/editor/extensions";
import { PROSE_CLASSES } from "@/components/editor/styles";
import { parseTagsToMentions } from "@/hooks/use-composer";
import { cn } from "@/lib/utils";

// Create a custom Highlight mark (re-added for static rendering)
const Highlight = Mark.create({
  name: "highlight",
  addOptions() {
    return {
      HTMLAttributes: {
        class:
          "bg-yellow-200 dark:bg-yellow-900 text-black dark:text-yellow-100 px-0.5 rounded",
      },
    };
  },
  parseHTML() {
    return [{ tag: "mark" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
});

interface NoteContentProps {
  content: string;
  space: string;
  highlight?: string;
}

export function NoteContent({ content, space, highlight }: NoteContentProps) {
  const html = useMemo(() => {
    if (!content) {
      return "";
    }

    try {
      // 1. Initialize headless editor with base extensions
      const editor = new Editor({
        editable: false,
        extensions: [...getMarlinExtensions({ space }), Highlight],
        content: content,
      });

      // 2. Parse hashtags into mentions (hydrating clean markdown back to UI chips)
      parseTagsToMentions(editor);

      // 3. Apply Highlighting if query exists
      const query = highlight?.trim();
      if (query && !query.startsWith("#")) {
        const { doc } = editor.state;
        const tr = editor.state.tr;
        const escapedQuery = query.replace(/[.*+?^${}()|[\\]/g, "\\$&");
        const regex = new RegExp(escapedQuery, "gi");

        doc.descendants((node, pos) => {
          if (node.isText && node.text) {
            let match;
            while ((match = regex.exec(node.text)) !== null) {
              const from = pos + match.index;
              const to = from + match[0].length;
              tr.addMark(from, to, editor.schema.marks.highlight.create());
            }
          }
        });

        if (tr.docChanged) {
          editor.view.dispatch(tr);
        }
      }

      const output = editor.getHTML();
      editor.destroy();
      // Make checkboxes read-only by adding disabled attribute
      return output.replace(
        /<input type="checkbox"/g,
        '<input type="checkbox" disabled'
      );
    } catch (e) {
      console.error("Failed to render note content", e);
      return '<p class="text-red-500">Error rendering note content</p>';
    }
  }, [content, space, highlight]);

  return (
    <div
      className={cn(
        PROSE_CLASSES,
        "note-stream" // Namespace for our global CSS mimicry
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
