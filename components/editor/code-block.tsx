import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";

import type { NodeViewProps } from "@tiptap/core";

// Common languages for the dropdown
const languages = [
  { value: "auto", label: "Auto" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "shell", label: "Shell" },
  { value: "markdown", label: "Markdown" },
  { value: "yaml", label: "YAML" },
];

export function CodeBlockComponent({
  node,
  updateAttributes,
  editor,
}: NodeViewProps) {
  return (
    <NodeViewWrapper className="relative group code-block">
      {editor.isEditable && (
        <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <select
            contentEditable={false}
            defaultValue={node.attrs.language || "auto"}
            onChange={(event) => {
              const value = event.target.value;
              updateAttributes({ language: value === "auto" ? null : value });
            }}
            className="h-6 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <pre className={`language-${node.attrs.language || "plaintext"}`}>
        {/* @ts-expect-error - NodeViewContent 'as' prop not properly typed */}
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
