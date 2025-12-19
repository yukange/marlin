import { mergeAttributes, ReactNodeViewRenderer } from '@tiptap/react'
import { DOMOutputSpec } from 'prosemirror-model'
import { InputRule, wrappingInputRule, AnyExtension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Mention from '@tiptap/extension-mention'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import { Markdown } from 'tiptap-markdown'
import { getSuggestionOptions } from '@/components/editor/suggestion'
import { CodeBlockComponent } from '@/components/editor/code-block'
import { SlashCommand } from '@/components/editor/slash-command'

const lowlight = createLowlight(all)

// Helper to convert Lowlight HAST to ProseMirror DOMOutputSpec
function parseNodes(nodes: any[]): DOMOutputSpec[] {
  return nodes.map(node => {
    if (node.type === 'text') {
      return node.value
    }
    if (node.type === 'element') {
      const attrs = node.properties || {}
      if (attrs.className) {
        attrs.class = attrs.className.join(' ')
        delete attrs.className
      }
      return [node.tagName, attrs, ...parseNodes(node.children || [])]
    }
    return ''
  })
}

export function getMarlinExtensions({ placeholder = 'Type a note...', space }: { isExpanded?: boolean, placeholder?: string, space?: string } = {}) {
  const extensions: AnyExtension[] = [
    Markdown.configure({
      transformPastedText: true,
      transformCopiedText: true,
    }),
    StarterKit.configure({
      codeBlock: false,
      link: false, // Disable default link to configure it separately
    }),
    CodeBlockLowlight.extend({
      addNodeView() {
        return ReactNodeViewRenderer(CodeBlockComponent)
      },
      renderHTML({ node, HTMLAttributes }) {
        const language = node.attrs.language || 'plaintext'
        const content = node.textContent

        // Generate highlighted AST
        let highlightedNodes: any[] = []
        try {
          if (language === 'plaintext' || language === 'auto' || !lowlight.listLanguages().includes(language)) {
            // Fallback for plaintext/auto/unknown: just text
            highlightedNodes = [{ type: 'text', value: content }]
          } else {
            const tree = lowlight.highlight(language, content)
            highlightedNodes = tree.children
          }
        } catch (e) {
          console.error('Highlighting failed', e)
          highlightedNodes = [{ type: 'text', value: content }]
        }

        return [
          'pre',
          mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
            class: 'overflow-x-auto',
            'data-language': node.attrs.language,
          }),
          [
            'code',
            {
              class: language ? 'language-' + language : null,
            },
            ...parseNodes(highlightedNodes)
          ],
        ]
      },
    }).configure({
      lowlight,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        target: '_blank',
        class: 'text-blue-500 underline hover:text-blue-600',
      },
    }),
    TaskList.configure({
      HTMLAttributes: {
        class: 'list-none pl-0',
      },
    }),
    TaskItem.extend({
      addInputRules() {
        return [
          wrappingInputRule({
            find: /^\s*([-+*])\s+\[([xX ])\]\s$/,
            type: this.type,
            getAttributes: match => ({
              checked: match[match.length - 1].toLowerCase() === 'x',
            }),
          }),
          new InputRule({
            find: /^\s*\[([xX ])\]\s$/,
            handler: ({ state, range, match }) => {
              const { $from } = state.selection
              const isListItem = $from.node(-1).type.name === 'listItem'
              if (isListItem) {
                // @ts-ignore
                setTimeout(() => {
                  // @ts-ignore
                  this.editor.chain()
                    .focus()
                    .deleteRange({ from: range.from, to: range.to })
                    .toggleTaskList()
                    .run()
                  if (match[1].toLowerCase() === 'x') {
                    // @ts-ignore
                    this.editor.commands.updateAttributes('taskItem', { checked: true })
                  }
                })
                return null
              }
              return null
            },
          }),
        ]
      },
    }).configure({
      nested: true,
      HTMLAttributes: {
        class: 'flex gap-2 items-center [&>label]:select-none [&_p]:my-0',
      },
    }),
    Placeholder.configure({
      placeholder,
    }),
    Image.configure({
      inline: false,
      allowBase64: true, // Allow base64 for local-first: images stored locally until note is sent
      HTMLAttributes: {
        class: 'rounded-lg max-w-full h-auto my-4',
      },
    }),
  ]

  if (space) {
    extensions.push(
      Mention.extend({
        addStorage() {
          return {
            markdown: {
              serialize(state: any, node: any) {
                state.write('#' + node.attrs.id)
              },
              parse: {
                // We assume markdown is just text #tag, which is parsed by main parser 
                // and then autolinked/mentioned by existing rules or just text.
                // If we needed to parse specific syntax back to mention node:
                // setup(markdownit) { ... }
              }
            }
          }
        },
        addKeyboardShortcuts() {
          return {
            Backspace: () => {
              const { selection } = this.editor.state
              const { empty, $anchor } = selection
              if (!empty) return false

              const nodeBefore = $anchor.nodeBefore
              if (nodeBefore && nodeBefore.type.name === this.name) {
                this.editor.commands.deleteRange({
                  from: $anchor.pos - nodeBefore.nodeSize,
                  to: $anchor.pos,
                })
                return true
              }
              return false
            },
          }
        },
      }).configure({
        HTMLAttributes: {
          class: 'mention text-blue-500 font-medium',
        },
        deleteTriggerWithBackspace: false,
        suggestion: getSuggestionOptions(space),
        renderText({ node }) {
          return `#${node.attrs.label ?? node.attrs.id}`
        },
        renderHTML({ node }) {
          return ['span', { class: 'mention text-blue-500 font-medium' }, `#${node.attrs.label ?? node.attrs.id}`]
        },
      }),
      SlashCommand.configure({
        space,
      })
    )
  }

  return extensions
}
