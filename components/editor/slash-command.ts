import { Extension } from '@tiptap/core'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance } from 'tippy.js'
import { CommandList } from './command-list'
import { FileText } from 'lucide-react'
import { db } from '@/lib/client/db'
import { Editor, Range } from '@tiptap/core'
import { insertTemplateContent } from '@/hooks/use-composer'
import { useStore } from '@/lib/store'
import { useProGateStore } from '@/hooks/use-pro-gate'

export interface CommandItem {
    title: string
    description?: string
    icon: any
    command: (props: { editor: Editor; range: Range }) => void
}

interface SlashCommandOptions {
    space: string
}

/**
 * Create suggestion options for slash command
 * Uses Tiptap's official Suggestion utility
 * 
 * Reads isPro directly from zustand store to get real-time value
 * (not the stale value from when the editor was initialized)
 * 
 * @see https://tiptap.dev/docs/editor/api/utilities/suggestion
 */
const getSuggestionOptions = (options: SlashCommandOptions): Omit<SuggestionOptions, 'editor'> => ({
    char: '/',
    startOfLine: true,

    items: async ({ query }) => {
        // Read isPro directly from store for real-time value
        const isPro = useStore.getState().isPro

        // If not Pro, return empty - Pro gate handled in render.onStart
        if (!isPro) {
            return []
        }

        // Fetch templates from DB
        const templates = await db.notes
            .where('space')
            .equals(options.space)
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
        let component: ReactRenderer<any> | null = null
        let popup: Instance[] | null = null

        return {
            onStart: props => {
                // Read isPro directly from store for real-time value
                const isPro = useStore.getState().isPro

                // Pro gate check - delete slash and show upgrade dialog
                if (!isPro) {
                    props.editor.chain().focus().deleteRange(props.range).run()
                    // Open the Pro gate dialog directly from store
                    useProGateStore.getState().openDialog()
                    return
                }

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
                if (!component) return
                component.updateProps(props)

                if (!props.clientRect) {
                    return
                }

                popup?.[0]?.setProps({
                    getReferenceClientRect: props.clientRect as () => DOMRect,
                })
            },

            onKeyDown: props => {
                if (!component) return false

                if (props.event.key === 'Escape') {
                    popup?.[0]?.hide()
                    return true
                }

                return component.ref?.onKeyDown(props) || false
            },

            onExit: () => {
                if (popup?.[0]) {
                    popup[0].destroy()
                }
                if (component) {
                    component.destroy()
                }
                popup = null
                component = null
            },
        }
    },
})

/**
 * Slash Command Extension for Tiptap
 * 
 * Features:
 * - Type `/` at the start of a line to trigger template suggestions
 * - Pro-gated: Non-Pro users are redirected to upgrade dialog
 * - Uses official @tiptap/suggestion utility
 * - Reads isPro directly from zustand store for real-time updates
 * 
 * @example
 * SlashCommand.configure({
 *   space: 'my-space',
 * })
 */
export const SlashCommand = Extension.create<SlashCommandOptions>({
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
                ...getSuggestionOptions(this.options),
            }),
        ]
    },
})
