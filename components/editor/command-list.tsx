"use client"

import React, { useEffect, useImperativeHandle, useState } from 'react'
import { CommandItem } from './slash-command'
import { cn } from '@/lib/utils'

interface CommandListProps {
    items: CommandItem[]
    command: (item: CommandItem) => void
}

export const CommandList = React.forwardRef((props: CommandListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
        const item = props.items[index]
        if (item) {
            props.command(item)
        }
    }

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    useEffect(() => {
        setSelectedIndex(0)
    }, [props.items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }

            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }

            if (event.key === 'Enter') {
                event.preventDefault()
                enterHandler()
                return true
            }

            return false
        },
    }))

    return (
        <div className="z-50 items-center rounded-md border border-zinc-200 bg-white p-1 text-zinc-950 shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 w-64 overflow-hidden">
            {props.items.length ? (
                <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                    {props.items.map((item, index) => (
                        <button
                            className={cn(
                                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
                                index === selectedIndex ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                            key={index}
                            onClick={() => selectItem(index)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                                {item.icon && <item.icon className="h-4 w-4 text-zinc-500" />}
                            </div>
                            <div className="flex flex-col items-start truncate text-left">
                                <span className="truncate font-medium">{item.title}</span>
                                {item.description && (
                                    <span className="text-[10px] text-zinc-500 truncate w-full">{item.description}</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="p-3 text-center text-sm text-zinc-500">No results</div>
            )}
        </div>
    )
})

CommandList.displayName = 'CommandList'
