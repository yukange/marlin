"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { Loader2 } from "lucide-react"
import { useSpaces } from "@/hooks/use-spaces"
import type { Space } from "@/lib/client/db"

export default function AppRoot() {
  const router = useRouter()
  const { lastActiveSpace } = useStore()
  const { spaces, isLoading } = useSpaces()

  useEffect(() => {
    if (!isLoading && spaces) {
      if (spaces.length > 0) {
        // Priority 1: Last active space (if it still exists)
        if (lastActiveSpace && spaces.some((s: Space) => s.name === lastActiveSpace)) {
          router.push(`/${lastActiveSpace}`)
        } else {
          // Priority 2: Most recently updated space
          router.push(`/${spaces[0].name}`)
        }
      } else {
        // No spaces: redirect to create new space
        router.push("/new")
      }
    }
  }, [spaces, isLoading, lastActiveSpace, router])

  return (
    <main className="grid place-items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </main>
  )
}
