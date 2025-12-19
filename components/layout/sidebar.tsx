"use client"

import * as React from "react"
import Image from "next/image"
import { SpaceSwitcher } from "@/components/layout/space-switcher"
import { UserNav } from "@/components/layout/user-nav"
import { Heatmap } from "@/components/layout/heatmap"
import { NewSpaceForm } from "@/components/layout/new-space-form"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Hash, Trash2, Library, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, useParams, useSearchParams, usePathname } from "next/navigation"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/client/db"
import { useSidebar } from "@/components/layout/sidebar-context"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  showNewSpace?: boolean
  onNewSpaceChange?: (show: boolean) => void
}

export function Sidebar({ className, showNewSpace = false, onNewSpaceChange }: SidebarProps) {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const currentSpaceName = params.space as string
  const currentQuery = searchParams.get('q') || ''

  const isTrashActive = pathname?.endsWith('/trash')
  const isTemplatesActive = searchParams.get('filter') === 'templates'
  const isAllNotesActive = pathname === `/${currentSpaceName}` && !currentQuery && !isTrashActive && !isTemplatesActive

  const allTags = useLiveQuery(
    async () => {
      if (!currentSpaceName) return []

      const notes = await db.notes
        .where('space')
        .equals(currentSpaceName)
        .filter(note => !note.deleted)
        .toArray()

      const tagSet = new Set<string>()
      notes.forEach(note => {
        note.tags.forEach(tag => tagSet.add(tag))
      })

      return Array.from(tagSet).sort()
    },
    [currentSpaceName]
  )

  if (showNewSpace) {
    return (
      <NewSpaceForm
        onCancel={() => onNewSpaceChange?.(false)}
        onSuccess={() => onNewSpaceChange?.(false)}
      />
    )
  }

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const targetQuery = `#${tag}`

    if (currentQuery === targetQuery) {
      params.delete('q')
    } else {
      params.set('q', targetQuery)
    }

    router.push(`/${currentSpaceName}?${params.toString()}`)
  }

  return (
    <aside className={cn("flex flex-col h-screen dark:bg-zinc-950 backdrop-blur-xl w-[300px] p-[10px] overflow-hidden", className)}>
      <nav className="flex-1 flex flex-col min-h-0 space-y-4">
        <section className="flex-shrink-0">
          <div className="mb-4 flex items-center gap-3">
            <Image
              src="/logo-light.svg"
              alt="Marlin Logo"
              width={32}
              height={32}
              className="hidden dark:block flex-shrink-0"
              priority
            />
            <Image
              src="/logo-dark.svg"
              alt="Marlin Logo"
              width={32}
              height={32}
              className="block dark:hidden flex-shrink-0"
              priority
            />
            <div className="flex items-center gap-2">
              <div className="relative">
                <Image
                  src="/text-logo-light.svg"
                  alt="Marlin"
                  width={80}
                  height={24}
                  className="hidden dark:block"
                  priority
                />
                <Image
                  src="/text-logo-dark.svg"
                  alt="Marlin"
                  width={80}
                  height={24}
                  className="block dark:hidden"
                  priority
                />
              </div>
              <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 tracking-wide uppercase">
                Beta
              </span>
            </div>
          </div>
          <SpaceSwitcher />
        </section>
        {currentSpaceName && (
          <section className="flex-shrink-0">
            <Heatmap space={currentSpaceName} />
          </section>
        )}

        {currentSpaceName && (
          <div className="flex-shrink-0">
            <button
              type="button"
              className={cn(
                "w-full flex items-center justify-start px-3 py-2 text-sm rounded-md transition-colors",
                isAllNotesActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              )}
              onClick={() => router.push(`/${currentSpaceName}`)}
            >
              <Library className="mr-2 h-4 w-4" />
              All Notes
            </button>
            <button
              type="button"
              className={cn(
                "w-full flex items-center justify-start px-3 py-2 text-sm rounded-md transition-colors",
                isTemplatesActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              )}
              onClick={() => {
                if (isTemplatesActive) {
                  router.push(`/${currentSpaceName}`)
                } else {
                  router.push(`/${currentSpaceName}?filter=templates`)
                }
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </button>
          </div>
        )}

        {currentSpaceName && allTags && allTags.length > 0 && (
          <section className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <h2 className="mb-2 text-lg font-semibold tracking-tight dark:text-zinc-100 flex-shrink-0 px-3">
              Tags
            </h2>
            <ul className="flex-1 overflow-y-auto space-y-1 min-h-0 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {allTags.map((tag) => {
                const isSelected = currentQuery === `#${tag}`
                return (
                  <li key={tag}>
                    <button
                      type="button"
                      className={cn(
                        "w-full flex items-center justify-start px-3 py-2 text-sm rounded-md transition-colors",
                        isSelected
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      )}
                      onClick={() => handleTagClick(tag)}
                    >
                      <Hash className="mr-2 h-4 w-4" />
                      {tag}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        {currentSpaceName && (
          <div className="flex-shrink-0 mt-auto pt-2">
            <Button
              variant={isTrashActive ? "secondary" : "ghost"}
              className={cn("w-full justify-start text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200", isTrashActive && "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100")}
              onClick={() => router.push(`/${currentSpaceName}/trash`)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Trash
            </Button>
          </div>
        )}
      </nav>
      <footer className="flex-shrink-0 mt-2">
        <UserNav />
      </footer>
    </aside>
  )
}

export function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useSidebar()

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="p-0 w-72">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <MobileSidebarContent onClose={() => setSidebarOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

function MobileSidebarContent({ onClose }: { onClose: () => void }) {
  const [showNewSpace, setShowNewSpace] = React.useState(false)

  const handleNewSpaceChange = (show: boolean) => {
    setShowNewSpace(show)
    if (!show) {
      onClose()
    }
  }

  return (
    <Sidebar
      className="border-none"
      showNewSpace={showNewSpace}
      onNewSpaceChange={handleNewSpaceChange}
    />
  )
}
