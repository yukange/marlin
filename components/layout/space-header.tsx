"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SpaceHeaderProps {
  spaceName: string // Display name without .marlin suffix
}

export function SpaceHeader({ spaceName }: SpaceHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')

  useEffect(() => {
    const q = searchParams.get('q')
    setQuery(q || '')
  }, [searchParams])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value.trim()) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    router.push(`/${spaceName}?${params.toString()}`, { scroll: false })
  }

  const handleClear = () => {
    setQuery('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.push(`/${spaceName}?${params.toString()}`, { scroll: false })
  }

  return (
    <header className="sticky top-0 z-10 backdrop-blur-xl dark:bg-zinc-950/70 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{spaceName}</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <Input
            id="search-input"
            type="text"
            placeholder="Search or #tag"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-9 h-9  dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-600 text-sm"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
