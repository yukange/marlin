"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, Lock, Globe } from "lucide-react"
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
import { useStore } from "@/lib/store"
import { useRouter, useParams } from "next/navigation"
import { useSidebar } from "@/components/layout/sidebar-context"
import { useSpaces } from "@/hooks/use-spaces"

export function SpaceSwitcher() {
  const [open, setOpen] = React.useState(false)
  const { setShowNewSpace } = useSidebar()
  
  const router = useRouter()
  const params = useParams()
  const { setCurrentSpace } = useStore()
  
  const currentSpaceName = params.space as string
  const { spaces } = useSpaces()

  const spacesList = spaces || []
  const selectedSpace = spacesList.find(space => space.name === currentSpaceName) || spacesList[0]

  React.useEffect(() => {
    if (currentSpaceName) {
      setCurrentSpace(currentSpaceName)
    }
  }, [currentSpaceName, setCurrentSpace])

  return (
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
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentSpaceName === space.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {space.isPrivate ? <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> : <Globe className="mr-2 h-4 w-4 text-muted-foreground" />}
                  {space.name}
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
                  setShowNewSpace(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Space
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
