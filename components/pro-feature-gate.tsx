"use client";

/**
 * Pro Feature Gate Dialog
 *
 * A modal dialog that appears when non-Pro users try to access Pro features.
 * Shows the benefits of upgrading and links to the pricing page.
 */
import { Crown, Image, FileText, Layers, Globe, Check } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProGateStore } from "@/hooks/use-pro-gate";

const PRO_FEATURES = [
  {
    icon: Layers,
    title: "Unlimited Spaces",
    description: "Organize notes across multiple spaces",
  },
  {
    icon: Image,
    title: "Image Uploads",
    description: "Embed images directly in your notes",
  },
  {
    icon: FileText,
    title: "Templates",
    description: "Create and reuse note templates",
  },
  {
    icon: Globe,
    title: "Share to Web",
    description: "Publish notes as shareable web pages",
  },
];

export function ProFeatureGate() {
  const router = useRouter();
  const { isOpen, closeDialog } = useProGateStore();

  const handleUpgrade = () => {
    closeDialog();
    router.push("/pricing");
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-md" data-composer-ignore-outside>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
          <DialogDescription>
            Unlock all features and supercharge your note-taking
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ul className="space-y-3">
            {PRO_FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#30CF79]/10">
                  <Check className="h-3.5 w-3.5 text-[#30CF79]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {feature.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleUpgrade}
            className="w-full rounded-xl h-11 bg-[#30CF79] hover:bg-[#2BC06E] text-white font-medium"
          >
            <Crown className="mr-2 h-4 w-4" />
            View Pricing
          </Button>
          <Button
            variant="ghost"
            onClick={closeDialog}
            className="w-full text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
