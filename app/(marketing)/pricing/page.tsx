"use client"

import { Check, Zap, Infinity, Github, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { NumberTicker } from "@/components/ui/number-ticker"

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly")

  const handleAuth = () => {
    signIn('github', { callbackUrl: '/app' })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
            Simple pricing, <br />
            <span className="text-[#30CF79]">lifetime ownership.</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Marlin is local-first and GitHub-native. No hidden servers, no data lock-in. 
            Choose the plan that fits your workflow.
          </p>
          
          <div className="mt-8 flex items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm font-medium text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Public Beta: All features free for early adopters
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 bg-white dark:bg-zinc-900/50 relative overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Community</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">$0</span>
                <span className="text-zinc-500 dark:text-zinc-400">/ forever</span>
              </div>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Perfect for personal knowledge management.
              </p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <PricingFeature text="1 Space (.marlin repo)" />
              <PricingFeature text="Basic Markdown Support" />
              <PricingFeature text="Local-First Sync" />
              <PricingFeature text="GitHub Storage" />
            </ul>

            <Button variant="outline" className="w-full rounded-xl h-12" onClick={handleAuth}>
              Get Started
            </Button>
          </div>

          {/* Pro Subscription */}
          <div className="flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 bg-white dark:bg-zinc-900/50 relative overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Pro Subscription</h3>
              </div>
              
              {/* Internal Toggle */}
              <div className="flex items-center gap-3 mb-6 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={cn(
                    "text-xs font-medium px-3 py-1.5 rounded-md transition-all",
                    billingCycle === "monthly" 
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={cn(
                    "text-xs font-medium px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5",
                    billingCycle === "yearly" 
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                  )}
                >
                  Yearly
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[9px] px-1 py-0.5 rounded-full">
                    -20%
                  </span>
                </button>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                  {billingCycle === "monthly" ? "$5" : "$4"}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">/ month</span>
              </div>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                {billingCycle === "monthly" ? "Flexible month-to-month plan." : "Billed annually at $48/year."}
              </p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <PricingFeature text="Unlimited Spaces" isPro />
              <PricingFeature text="Image Paste & Upload" isPro />
              <PricingFeature text="One-click Publish" isPro />
              <PricingFeature text="Template Support" isPro />
              <PricingFeature text="Early Access to Features" isPro />
            </ul>

            <Button className="w-full rounded-xl h-12 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200" onClick={handleAuth}>
              Join Beta (Free)
            </Button>
          </div>

          {/* Pro Lifetime */}
          <div className="flex flex-col rounded-3xl border-2 border-[#30CF79] p-8 bg-white dark:bg-zinc-900 relative overflow-hidden transition-all shadow-[0_0_40px_-10px_rgba(48,207,121,0.2)]">
            <div className="absolute top-0 right-0">
                <div className="bg-[#30CF79] text-white text-[10px] font-bold px-4 py-1 rotate-45 translate-x-[24px] translate-y-[10px] w-[100px] text-center uppercase tracking-widest">
                    Best Value
                </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Pro Lifetime</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">$99</span>
                <span className="text-sm text-zinc-500 line-through decoration-red-500/50">$149</span>
              </div>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Own Marlin forever. One-time payment, no recurring fees.
              </p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <PricingFeature text="Unlimited Spaces" isPro />
              <PricingFeature text="Everything in Pro Subscription" isPro />
              <PricingFeature text="Priority Support" isPro />
              <PricingFeature text="Lifetime Updates" isPro />
              <PricingFeature text="Badge in Profile" isPro />
            </ul>

            <Button className="w-full rounded-xl h-12 bg-[#30CF79] hover:bg-[#2BC06E] text-white border-0" onClick={handleAuth}>
              Buy Lifetime
            </Button>
          </div>
        </div>

        {/* Comparison Section (Simplified) */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12 dark:text-zinc-100">Why go Pro?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Infinity className="h-5 w-5 text-[#30CF79]" />
              </div>
              <div>
                <h4 className="font-semibold dark:text-zinc-100">Unlimited Spaces</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Create separate repositories for your work, side projects, and personal life. No limits on how you organize.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Zap className="h-5 w-5 text-[#30CF79]" />
              </div>
              <div>
                <h4 className="font-semibold dark:text-zinc-100">Instant Image Upload</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Just paste an image into the editor. We'll handle the upload to your GitHub repository automatically.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Github className="h-5 w-5 text-[#30CF79]" />
              </div>
              <div>
                <h4 className="font-semibold dark:text-zinc-100">One-click Publish</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Instantly turn any note into a beautiful, public webpage using GitHub Gists. Share your thoughts with a single link, no deployment needed.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-[#30CF79]" />
              </div>
              <div>
                <h4 className="font-semibold dark:text-zinc-100">Custom Templates</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Set up templates for meeting notes, daily journals, or project briefs to speed up your note-taking process.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-24 text-center border-t border-zinc-100 dark:border-zinc-800 pt-8">
           <p className="text-zinc-500 dark:text-zinc-400 text-sm">
             Have questions? <a href="https://github.com/marlin" className="underline hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Visit our GitHub Discussions</a>
           </p>
        </div>
      </div>
    </div>
  )
}

function PricingFeature({ text, isPro = false }: { text: string, isPro?: boolean }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <div className={cn(
        "mt-0.5 h-4 w-4 shrink-0 rounded-full flex items-center justify-center",
        isPro ? "bg-[#30CF79]/20" : "bg-zinc-100 dark:bg-zinc-800"
      )}>
        <Check className={cn("h-3 w-3", isPro ? "text-[#30CF79]" : "text-zinc-500")} />
      </div>
      <span className="text-zinc-600 dark:text-zinc-400">{text}</span>
    </li>
  )
}
