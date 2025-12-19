"use client"

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/client/db'
import { FileText, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'

interface TemplatePickerProps {
    space: string
    onSelect: (content: string) => void
    disabled?: boolean
}

export function TemplatePicker({ space, onSelect, disabled }: TemplatePickerProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')

    // Query templates from database
    const templates = useLiveQuery(
        async () => {
            return db.notes
                .where('space')
                .equals(space)
                .filter(note => note.isTemplate === true && !note.deleted)
                .toArray()
        },
        [space]
    )

    // Filter templates based on search
    const filteredTemplates = useMemo(() => {
        if (!templates) return []
        if (!search.trim()) return templates
        const query = search.toLowerCase()
        return templates.filter(t =>
            (t.title || '').toLowerCase().includes(query) ||
            t.content.toLowerCase().includes(query)
        )
    }, [templates, search])

    const handleSelect = (content: string) => {
        onSelect(content)
        setOpen(false)
        setSearch('')
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setSearch('')
        }
    }

    const hasTemplates = templates && templates.length > 0

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className="h-8 w-8 relative"
                    title="Use template"
                >
                    <FileText className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 rounded-[3px] bg-amber-100 dark:bg-amber-900/40 px-0.5 text-[7px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 leading-none">
                        PRO
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="start"
                className="w-64 p-0"
                sideOffset={8}
                data-composer-ignore-outside=""
                onPointerDownOutside={(e) => {
                    // Prevent closing the composer when clicking inside the popover
                    e.preventDefault()
                }}
                onInteractOutside={(e) => {
                    // Prevent closing the composer when interacting inside the popover
                    e.preventDefault()
                }}
            >
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Templates
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setOpen(false)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
                {hasTemplates && (
                    <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-7 pr-2 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                            />
                        </div>
                    </div>
                )}
                <div className="max-h-64 overflow-y-auto">
                    {!hasTemplates ? (
                        <div className="px-3 py-6 text-center text-sm text-zinc-500">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No templates yet</p>
                            <p className="text-xs mt-1">Mark a note as template to use it here</p>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-zinc-500">
                            No templates match &quot;{search}&quot;
                        </div>
                    ) : (
                        <ul className="py-1">
                            {filteredTemplates.map((template) => (
                                <li key={template.id}>
                                    <button
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-sm",
                                            "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                            "transition-colors"
                                        )}
                                        onClick={() => handleSelect(template.content)}
                                    >
                                        <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                            {template.title || 'Untitled Template'}
                                        </div>
                                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                            {template.content.slice(0, 50)}...
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
