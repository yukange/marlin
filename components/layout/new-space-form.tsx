"use client"

import * as React from "react"
import Image from "next/image"
import { X, Lock, Globe, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createSpace, validateSpaceName } from "@/lib/services/space-service"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

interface NewSpaceFormProps {
  onCancel?: () => void
  onSuccess?: (spaceName: string) => void
}

export function NewSpaceForm({ onCancel, onSuccess }: NewSpaceFormProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isPrivate, setIsPrivate] = React.useState(true)

  const router = useRouter()
  const isPro = useStore((state) => state.isPro)

  const validation = React.useMemo(() => validateSpaceName(name), [name])

  const createSpaceMutation = useMutation({
    mutationFn: async () => {
      await createSpace(name, description, isPrivate)
    },
    onSuccess: () => {
      // Note: No invalidateQueries needed - createSpace writes to Dexie DB
      // and useLiveQuery in useSpaces automatically picks up the change
      toast.success("Space created successfully")
      resetForm()
      onSuccess?.(name)
      router.push(`/${name}`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to create space: ${error.message}`)
    },
  })

  const resetForm = () => {
    setName("")
    setDescription("")
    setIsPrivate(true)
  }

  const handleCancel = () => {
    if (!createSpaceMutation.isPending) {
      resetForm()
      onCancel?.()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      createSpaceMutation.mutate()
    }
  }

  return (
    <aside className="pb-12 min-h-screen border-r  dark:bg-zinc-950 dark:border-zinc-800 flex flex-col w-[300px]">
      <header className="flex items-center justify-between px-6 py-4 border-b dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-light.svg"
            alt="Marlin Logo"
            width={28}
            height={28}
            className="hidden dark:block"
          />
          <Image
            src="/logo-dark.svg"
            alt="Marlin Logo"
            width={28}
            height={28}
            className="block dark:hidden"
          />
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold dark:text-zinc-100">New Space</h2>
            {!isPro && (
              <span className="rounded-[4px] bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 tracking-wider">
                PRO
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          disabled={createSpaceMutation.isPending}
          className="h-8 w-8 rounded-full dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <fieldset className="flex-1 overflow-y-auto px-6 py-6 space-y-6" disabled={createSpaceMutation.isPending}>
          <label htmlFor="space-name" className="space-y-2 block">
            <span className="text-sm font-medium dark:text-zinc-200">
              Space Name <span className="text-red-500">*</span>
            </span>
            <Input
              id="space-name"
              placeholder="e.g. life, work, projects"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "h-11",
                name && !validation.valid && "border-red-500 focus-visible:ring-red-500"
              )}
              autoFocus
            />
            {name && !validation.valid ? (
              <span className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validation.error}
              </span>
            ) : (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
                A repository named <span className="font-mono">{name || 'name'}.marlin</span> will be created
              </span>
            )}
          </label>

          <label htmlFor="space-description" className="space-y-2 block">
            <span className="text-sm font-medium dark:text-zinc-200">Description</span>
            <Input
              id="space-description"
              placeholder="What's this space for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
              Optional description for your space
            </span>
          </label>

          <fieldset role="radiogroup" className="space-y-3">
            <legend className="text-sm font-medium dark:text-zinc-200">Visibility</legend>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-xl border p-4 transition-all text-left",
                  isPrivate
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50"
                    : "border-zinc-200 dark:border-zinc-700  dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600"
                )}
              >
                <span className="flex items-center gap-2 font-medium text-sm dark:text-zinc-100">
                  <Lock className="h-4 w-4" />
                  Private
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Only you can see this space
                </span>
                {isPrivate && (
                  <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 transition-all text-left",
                  !isPrivate
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50"
                    : "border-zinc-200 dark:border-zinc-700  dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600"
                )}
              >
                <span className="flex items-center gap-2 font-medium text-sm dark:text-zinc-100">
                  <Globe className="h-4 w-4" />
                  Public
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Anyone can see this space
                </span>
                {!isPrivate && (
                  <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100" aria-hidden="true" />
                )}
              </button>
            </div>
          </fieldset>
        </fieldset>

        <footer className="border-t dark:border-zinc-800 px-6 py-4  dark:bg-zinc-950 flex flex-col gap-2">
          <Button
            type="submit"
            disabled={!name.trim() || !validation.valid || createSpaceMutation.isPending}
            className="w-full rounded-lg bg-[#30CF79] hover:bg-[#2BC06E] text-white border-0"
          >
            {createSpaceMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Space"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={createSpaceMutation.isPending}
            className="w-full rounded-lg"
          >
            Cancel
          </Button>
        </footer>
      </form>
    </aside>
  )
}
