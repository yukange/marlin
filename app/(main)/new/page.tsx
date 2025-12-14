"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useMemo } from "react"
import { createSpace, validateSpaceName } from "@/lib/services/space-service"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Lock, Globe, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function NewSpacePage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(true)
  
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const validation = useMemo(() => validateSpaceName(name), [name])

  const createSpaceMutation = useMutation({
    mutationFn: async () => {
      await createSpace(name, description, isPrivate)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      // Use space name (without .marlin suffix) for routing
      const spaceName = name.replace(/\.marlin$/, '')
      toast.success("Space created successfully")
      router.push(`/${spaceName}`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to create space: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      createSpaceMutation.mutate()
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your first Space</CardTitle>
          <CardDescription>
            A Space is a GitHub repository where your notes will be stored.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Space Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. life, work, projects"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createSpaceMutation.isPending}
                className={cn(
                  "h-11",
                  name && !validation.valid && "border-red-500 focus-visible:ring-red-500"
                )}
                autoFocus
              />
              {name && !validation.valid ? (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validation.error}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  A repository named <span className="font-mono">{name || 'name'}.marlin</span> will be created
                </p>
              )}
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Input
                id="description"
                placeholder="What's this space for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={createSpaceMutation.isPending}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Optional description for your space
              </p>
            </div>

            {/* Privacy Toggle */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-medium">Visibility</Label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  disabled={createSpaceMutation.isPending}
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 transition-all",
                    isPrivate
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50"
                      : "border-zinc-200 dark:border-zinc-700  dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600",
                    createSpaceMutation.isPending && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium text-sm dark:text-zinc-100">Private</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-left">
                    Only you can see this space
                  </p>
                  {isPrivate && (
                    <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  disabled={createSpaceMutation.isPending}
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 transition-all",
                    !isPrivate
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50"
                      : "border-zinc-200 dark:border-zinc-700  dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600",
                    createSpaceMutation.isPending && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium text-sm dark:text-zinc-100">Public</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-left">
                    Anyone can see this space
                  </p>
                  {!isPrivate && (
                    <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit"
              className="w-full rounded-full bg-[#30CF79] hover:bg-[#2BC06E] text-white mt-4" 
              disabled={!name.trim() || !validation.valid || createSpaceMutation.isPending}
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
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
