import { Extension } from '@tiptap/core'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { CommandList } from './command-list'
import { FileText } from 'lucide-react'
import { db } from '@/lib/client/db'
import { Editor, Range } from '@tiptap/core'
import { insertTemplateContent } from '@/hooks/use-composer'

export interface CommandItem {
    title: string
    description?: string
    icon: any
    command: (props: { editor: Editor; range: Range }) => void
}

const getSuggestionOptions = (space: string): Omit<SuggestionOptions, 'editor'> => ({
    char: '/',
    startOfLine: true,
    items: async ({ query }) => {
        // Fetch templates from DB
        const templates = await db.notes
            .where('space')
            .equals(space)
            .filter(note => note.isTemplate === true && !note.deleted)
            .toArray()

        // Convert to commands
        const items: CommandItem[] = templates.map(template => ({
            title: template.title || 'Untitled Template',
            description: template.content.slice(0, 30) + '...',
            icon: FileText,
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                // Delete the slash command trigger first
                editor.chain().focus().deleteRange(range).run()
                // Then insert template using unified helper
                insertTemplateContent(editor, template.content)
            }
        })).filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 10) // Limit results

        return items
    },
    command: ({ editor, range, props }: { editor: Editor; range: Range; props: CommandItem }) => {
        props.command({ editor, range })
    },
    render: () => {
        let component: ReactRenderer<any>
        let popup: any

        return {
            onStart: props => {
                component = new ReactRenderer(CommandList, {
                    props,
                    editor: props.editor,
                })

                if (!props.clientRect) {
                    return
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect as any,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                })
            },

            onUpdate: props => {
                component.updateProps(props)

                if (!props.clientRect) {
                    return
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                })
            },

            onKeyDown: props => {
                if (props.event.key === 'Escape') {
                    popup[0].hide()
                    return true
                }

                return component.ref?.onKeyDown(props) || false
            },

            onExit: () => {
                popup[0].destroy()
                component.destroy()
            },
        }
    },
})

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            space: '',
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...getSuggestionOptions(this.options.space),
            }),
        ]
    },
})
