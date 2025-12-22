"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, Lock, Globe, MoreHorizontal, ExternalLink, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"
import { useProGate } from "@/hooks/use-pro-gate"
import { useRouter, useParams } from "next/navigation"
import { useSidebar } from "@/components/layout/sidebar-context"
import { useSpaces } from "@/hooks/use-spaces"
import { useGitHubUser } from "@/hooks/use-github-user"
import { deleteSpace, spaceToRepo } from "@/lib/services/space-service"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function SpaceSwitcher() {
  const [open, setOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [spaceToDelete, setSpaceToDelete] = React.useState<string | null>(null)
  const [confirmName, setConfirmName] = React.useState("")
  const { setShowNewSpace } = useSidebar()

  const router = useRouter()
  const params = useParams()
  const { setCurrentSpace } = useStore()
  const { isPro, requirePro } = useProGate()
  const { data: user } = useGitHubUser()

  const currentSpaceName = params.space as string
  const { spaces } = useSpaces()

  const spacesList = spaces || []
  const selectedSpace = spacesList.find(space => space.name === currentSpaceName) || spacesList[0]

  React.useEffect(() => {
    if (currentSpaceName) {
      setCurrentSpace(currentSpaceName)
    }
  }, [currentSpaceName, setCurrentSpace])

  const deleteSpaceMutation = useMutation({
    mutationFn: async (spaceName: string) => {
      if (!user) throw new Error("Not authenticated")
      await deleteSpace(spaceName, user.login)
    },
    onSuccess: () => {
      toast.success("Space deleted successfully")
      setDeleteDialogOpen(false)
      setSpaceToDelete(null)
      setConfirmName("")

      // Navigate to first other space or /new
      const otherSpaces = spacesList.filter(s => s.name !== spaceToDelete)
      if (otherSpaces.length > 0) {
        router.push(`/${otherSpaces[0].name}`)
      } else {
        router.push("/new")
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete space: ${error.message}`)
    },
  })

  const handleOpenInGitHub = (spaceName: string) => {
    if (!user) return
    const repoName = spaceToRepo(spaceName)
    window.open(`https://github.com/${user.login}/${repoName}`, "_blank")
  }

  const handleDeleteClick = (spaceName: string) => {
    setSpaceToDelete(spaceName)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (spaceToDelete && confirmName === spaceToDelete) {
      deleteSpaceMutation.mutate(spaceToDelete)
    }
  }

  const isConfirmValid = spaceToDelete && confirmName === spaceToDelete

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between gap-2"
          >
            {selectedSpace ? (
              <>
                {selectedSpace.isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                <span className="truncate flex-1 text-left">{selectedSpace.name}</span>
              </>
            ) : (
              <span className="flex-1 text-left">Select space...</span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandInput placeholder="Search space..." />
            <CommandList>
              <CommandEmpty>No space found.</CommandEmpty>
              <CommandGroup heading="Spaces">
                {spacesList.map((space) => (
                  <CommandItem
                    key={space.name}
                    onSelect={() => {
                      setOpen(false)
                      router.push(`/${space.name}`)
                    }}
                    className="text-sm flex items-center justify-between group"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          currentSpaceName === space.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {space.isPrivate ? <Lock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" /> : <Globe className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span className="truncate">{space.name}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 hover:bg-accent"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleOpenInGitHub(space.name)
                        }}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in GitHub
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpen(false)
                            handleDeleteClick(space.name)
                          }}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Space
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    // Free users can only have 1 space
                    if (!isPro && spacesList.length >= 1) {
                      requirePro(() => setShowNewSpace(true))
                    } else {
                      setShowNewSpace(true)
                    }
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    New Space
                  </div>
                  {!isPro && (
                    <span className="ml-2 rounded-[4px] bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 tracking-wider">
                      PRO
                    </span>
                  )}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open)
        if (!open) {
          setSpaceToDelete(null)
          setConfirmName("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Space</DialogTitle>
            <DialogDescription className="text-left">
              This will permanently delete the GitHub repository{" "}
              <span className="font-mono font-semibold">{spaceToDelete}.marlin</span>{" "}
              and all its contents. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="confirm-name">
              Type <span className="font-mono font-semibold">{spaceToDelete}</span> to confirm
            </Label>
            <Input
              id="confirm-name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={spaceToDelete || ""}
              disabled={deleteSpaceMutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setSpaceToDelete(null)
                setConfirmName("")
              }}
              disabled={deleteSpaceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={!isConfirmValid || deleteSpaceMutation.isPending}
            >
              {deleteSpaceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Space"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

