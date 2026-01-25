"use client";

import { Check } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTags } from "@/hooks/use-tags";
import { cn } from "@/lib/utils";

interface AutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    name: string;
    frequency: "daily" | "weekly";
    tags: string[];
  };
  onSave: (data: {
    name: string;
    frequency: "daily" | "weekly";
    tags: string[];
  }) => Promise<void> | void;
}

export function AutomationDialog({
  open,
  onOpenChange,
  initialValues,
  onSave,
}: AutomationDialogProps) {
  const [name, setName] = React.useState("");
  const [frequency, setFrequency] = React.useState<"daily" | "weekly">("daily");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const availableTags = useTags();

  React.useEffect(() => {
    if (open) {
      if (initialValues) {
        setName(initialValues.name);
        setFrequency(initialValues.frequency);
        setSelectedTags(initialValues.tags);
      } else {
        setName("");
        setFrequency("daily");
        setSelectedTags([]);
      }
    }
  }, [open, initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        name,
        frequency,
        tags: selectedTags,
      });
      onOpenChange(false);
      // Reset form
      setName("");
      setFrequency("daily");
      setSelectedTags([]);
    } catch (error) {
      console.error("Failed to save automation", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-visible sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialValues ? "Edit Automation" : "Create Automation"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Summary Automation"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <div className="relative">
              <select
                id="frequency"
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as "daily" | "weekly")
                }
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <div className="space-y-2 flex flex-col">
            <Label>Tags</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <div
                  role="combobox"
                  aria-expanded={openCombobox}
                  aria-controls="tags-listbox"
                  className="flex min-h-[40px] w-full flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer"
                >
                  {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="mr-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTag(tag);
                        }}
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">
                      Select tags...
                    </span>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search tags..." />
                  <CommandList>
                    <CommandEmpty>No tag found.</CommandEmpty>
                    <CommandGroup>
                      {availableTags.map((tag) => (
                        <CommandItem
                          key={tag}
                          value={tag}
                          onSelect={() => toggleTag(tag)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTags.includes(tag)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {tag}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : initialValues
                  ? "Save Changes"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
