import {
  Github,
  Database,
  Cloud,
  Lock,
  Zap,
  FileText,
  Check,
  Search,
} from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

import { SignInButton } from "@/components/layout/sign-in-button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marlin Note App - Local First GitHub Note Taking",
  description:
    "The ultimate local first markdown editor for developers. Marlin is a GitHub note taking app that syncs directly to your repo. Zero latency, full privacy.",
  keywords: [
    "marlin note app",
    "github note taking",
    "local first markdown editor",
    "markdown notes",
    "developer note app",
    "offline markdown",
    "github notes",
    "private notes",
    "open source note taking",
  ],
  openGraph: {
    title: "Marlin Note App - Local First GitHub Note Taking",
    description:
      "The local-first markdown editor that treats your GitHub repo as storage. Secure, fast, and open source.",
    url: "https://marlinnotes.com",
    siteName: "Marlin Note App",
    images: [
      {
        url: "/landing-hero.avif",
        width: 1200,
        height: 630,
        alt: "Marlin Note App Interface",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marlin Note App - Your Repo, Your Notes",
    description:
      "The local first markdown editor for GitHub note taking. Zero-latency, offline-ready.",
    images: ["/landing-hero.avif"],
  },
  alternates: {
    canonical: "https://marlinnotes.com",
  },
};

export default async function MarketingPage() {
  const session = await auth();
  if (session) {
    redirect("/app");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Marlin",
            url: "https://marlinnotes.com",
            image: "https://marlinnotes.com/landing-hero.avif",
            operatingSystem: "Web, Browser",
            applicationCategory: "ProductivityApplication",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            description:
              "A GitHub-native, local-first note-taking application for developers.",
            featureList:
              "Local-first, GitHub sync, Markdown support, Offline capable",
          }),
        }}
      />

      {/* 2. Hero Section */}
      <section className="container max-w-7xl mx-auto flex flex-col items-center gap-8 py-24 text-center md:py-32">
        <Badge
          variant="secondary"
          className="rounded-full px-4 py-1 text-sm font-normal bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
        >
          Now live on Edge Runtime
        </Badge>

        <div className="space-y-4 max-w-[64rem]">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-white">
            Your Notes. Your Repo. <br className="hidden sm:inline" />
            <span className="text-zinc-400">Zero Latency.</span>
          </h1>
          <p className="mx-auto max-w-[42rem] leading-normal text-zinc-300 sm:text-xl sm:leading-8">
            Marlin is a <strong className="text-zinc-300">Local-First</strong>{" "}
            stream-based note-taking app. It uses your{" "}
            <strong className="text-zinc-300">GitHub private repository</strong>{" "}
            as the backend, combined with{" "}
            <strong className="text-zinc-300">Edge</strong> computing and{" "}
            <strong className="text-zinc-300">IndexedDB</strong> for
            native-app-like speed.
          </p>
        </div>

        <div className="flex gap-4">
          <SignInButton variant="primary" size="lg" />
        </div>
        <div className="flex flex-col items-center gap-2 text-sm text-zinc-400">
          <p>Open Source Friendly · Local First · BYO GitHub Repo</p>
        </div>

        {/* Hero Visual */}
        <div className="relative mt-12 w-full max-w-5xl group">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[32px] blur opacity-20" />

          <div className="relative rounded-[32px] border border-zinc-800 bg-zinc-900/50 shadow-2xl backdrop-blur-sm overflow-hidden">
            <Image
              src="/landing-hero.avif"
              alt="Marlin App Interface"
              width={2040}
              height={1890}
              priority
              fetchPriority="high"
              className="w-full h-auto"
            />

            {/* Emerging from darkness effect: Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[32px] pointer-events-none" />
          </div>

          <div className="absolute -bottom-8 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <p className="text-xs text-zinc-600 font-mono">
              Apple HIG compliant UI.
            </p>
          </div>
        </div>

        {/* Code Snippet Demo */}
        <div className="mt-2 w-full max-w-2xl rounded-lg bg-black border border-zinc-800 p-4 text-left shadow-xl">
          <div className="flex gap-1.5 mb-4">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <pre className="font-mono text-sm text-zinc-50 overflow-x-auto">
            <span className="text-zinc-600">$</span> git commit -m &quot;New
            note from Marlin&quot;{"\n"}
            <span className="text-zinc-600">$</span> git push origin main{"\n"}
            <span className="text-zinc-600">#</span>{" "}
            <span className="text-green-400">
              Marlin does this for you, automatically.
            </span>
          </pre>
        </div>
      </section>

      {/* 3. Tech Stack Trust */}
      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="container max-w-7xl mx-auto py-12 md:py-24 text-center">
          <p className="mb-8 text-sm font-semibold text-zinc-500 uppercase tracking-wider">
            Powered by the modern edge stack
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 grayscale opacity-70">
            <div className="flex items-center gap-2 font-semibold text-lg text-zinc-400">
              <Cloud className="h-6 w-6" /> Cloudflare Workers
            </div>
            <div className="flex items-center gap-2 font-semibold text-lg text-zinc-400">
              <Zap className="h-6 w-6" /> Next.js 15
            </div>
            <div className="flex items-center gap-2 font-semibold text-lg text-zinc-400">
              <Github className="h-6 w-6" /> GitHub
            </div>
            <div className="flex items-center gap-2 font-semibold text-lg text-zinc-400">
              <Database className="h-6 w-6" /> Dexie.js
            </div>
            <div className="flex items-center gap-2 font-semibold text-lg text-zinc-400">
              <FileText className="h-6 w-6" /> Tiptap
            </div>
          </div>
        </div>
      </section>

      {/* 4. Value Proposition */}
      <section
        id="features"
        className="container max-w-7xl mx-auto py-24 space-y-24 md:py-32"
      >
        {/* Module A: Data Sovereignty */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
              No Vendor Lock-in. <br />
              Data Sovereignty.
            </h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Stop worrying about proprietary formats or export limits. Marlin
              syncs directly with your GitHub repository, storing every note as
              a standard Markdown file. You own your data, forever.
            </p>
            <ul className="space-y-3 text-zinc-300">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />{" "}
                <span>Standard Markdown (GFM)</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />{" "}
                <span>Git Version Control</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />{" "}
                <span>Portable & Parsable</span>
              </li>
            </ul>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500/5 blur-[80px] rounded-full" />
            <div className="relative font-mono text-sm text-zinc-400 bg-zinc-950/90 backdrop-blur border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-2 text-zinc-500 mb-4 border-b border-zinc-800 pb-2">
                <Github className="h-4 w-4" /> repo-root
              </div>
              <div className="pl-4 space-y-2">
                <div className="flex items-center gap-2">📁 notes</div>
                <div className="pl-6 text-zinc-200">📄 1700000000001.md</div>
                <div className="pl-6 text-zinc-200">📄 1700000000002.md</div>
                <div className="flex items-center gap-2">📄 README.md</div>
              </div>
            </div>
          </div>
        </div>

        {/* Module B: Local-First Speed */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="order-2 lg:order-1 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-green-500/5 blur-[80px] rounded-full" />
            <div className="relative w-full max-w-md bg-zinc-950/90 backdrop-blur border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4 transform -rotate-1 transition-transform duration-500 hover:rotate-0">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="w-full pl-10 py-2 text-sm border border-zinc-800 rounded-md bg-zinc-900/50 text-zinc-300 placeholder:text-zinc-600">
                  deploy
                </div>
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <span className="text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 font-medium">
                    0ms
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
              Faster than Fast.
            </h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Built on a Local-First architecture using IndexedDB. Search,
              filter, and navigate through thousands of notes with{" "}
              <strong className="text-zinc-300">0ms latency</strong>, even when
              you are offline. Sync happens quietly in the background.
            </p>
            <ul className="space-y-3 text-zinc-300">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />{" "}
                <span>Full Offline Support</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />{" "}
                <span>Instant Search</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />{" "}
                <span>Background Sync</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Module C: The Stream */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
              Capture at the Speed of Thought.
            </h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              A stream-based interface designed for dumping thoughts without
              friction. The Tiptap-powered editor supports slash commands,
              markdown shortcuts, and code highlighting out of the box.
            </p>
            <ul className="space-y-3 text-zinc-300">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />{" "}
                <span>Slash Commands</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />{" "}
                <span>Markdown Shortcuts</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />{" "}
                <span>Code Highlighting</span>
              </li>
            </ul>
          </div>
          <div className="relative flex items-center justify-center h-[400px] group">
            <div className="absolute inset-0 bg-purple-500/5 blur-[80px] rounded-full" />

            <div className="relative w-full max-w-lg aspect-[1.4/1] transform transition-transform duration-700 group-hover:scale-[1.02]">
              {/* Image 1: Type a note (Default) */}
              <Image
                src="/landing-feature-stream.avif"
                alt="Type a note interface"
                fill
                className="object-contain drop-shadow-2xl transition-all duration-700 ease-in-out opacity-100 scale-100 blur-0 group-hover:opacity-0 group-hover:scale-95 group-hover:blur-sm"
              />

              {/* Image 2: New note (Hover) */}
              <Image
                src="/landing-feature-composer.avif"
                alt="Rich text composer"
                fill
                className="object-contain drop-shadow-2xl transition-all duration-700 ease-in-out opacity-0 scale-105 blur-sm group-hover:opacity-100 group-hover:scale-100 group-hover:blur-none"
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 text-center opacity-100 group-hover:opacity-0 transition-opacity duration-300">
              <span className="text-xs font-medium text-zinc-500 bg-zinc-950/80 px-3 py-1 rounded-full border border-zinc-800 backdrop-blur-sm">
                Hover to reveal composer
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Bento Grid */}
      <section className="bg-zinc-950 py-24 md:py-32 border-y border-zinc-800/50">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[400px]">
            {/* Left Tower: Activity & Structure */}
            <div className="relative md:col-span-1 md:row-span-2 group">
              <div className="absolute inset-0 bg-orange-500/5 blur-[80px] rounded-full" />
              <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl bg-zinc-900/20 backdrop-blur-sm border border-white/5">
                <Image
                  src="/landing-bento-activity.avif"
                  alt="Activity & Structure"
                  fill
                  className="object-cover object-left-top opacity-90 transition-opacity duration-500 hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Activity & Structure
                  </h3>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    Visualize your coding habits with heatmaps and organize via
                    tags.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Top: Code Native */}
            <div className="relative md:col-span-2 group">
              <div className="absolute inset-0 bg-indigo-500/5 blur-[80px] rounded-full" />
              <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl bg-zinc-900/20 backdrop-blur-sm border border-white/5">
                <div className="absolute inset-0 flex items-center justify-center p-2 pb-20">
                  <Image
                    src="/landing-bento-code.avif"
                    alt="Code Native"
                    width={800}
                    height={600}
                    className="object-contain max-h-full w-auto drop-shadow-2xl transition-transform duration-500 group-hover:-translate-y-2"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 pt-32 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent">
                  <h3 className="text-xl font-bold text-white mb-1">
                    Code Native
                  </h3>
                  <p className="text-zinc-300 text-sm">
                    First-class support for code blocks and syntax highlighting.
                  </p>
                  <p className="text-xs text-zinc-500 mt-2 font-mono">
                    Syntax highlighting support for 100+ languages.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Bottom: Zero Latency Sync */}
            <div className="relative md:col-span-2 group">
              <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full" />
              <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl bg-zinc-900/20 backdrop-blur-sm border border-white/5">
                <div className="absolute inset-0 flex items-center justify-center p-2 pb-20">
                  <Image
                    src="/landing-bento-sync.avif"
                    alt="Zero Latency Sync"
                    width={800}
                    height={600}
                    className="object-contain max-h-full w-auto drop-shadow-2xl transition-transform duration-500 group-hover:-translate-y-2"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 pt-32 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white">
                      Zero Latency Sync
                    </h3>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <p className="text-zinc-300 text-sm">
                    Optimistic UI ensures you never wait for the network.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. How it Works */}
      <section className="container max-w-7xl mx-auto py-24 md:py-32 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-12 text-white">
          Secure by Architecture
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm font-medium text-zinc-400">
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm w-64">
            <div className="mb-4 flex justify-center">
              <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <Zap className="h-6 w-6 text-zinc-400" />
              </div>
            </div>
            <div className="font-bold text-zinc-100 mb-1">Browser</div>
            <div className="text-xs text-zinc-500">HttpOnly Cookie</div>
          </div>
          <div className="hidden md:block h-px w-16 bg-zinc-700" />
          <div className="md:hidden h-8 w-px bg-zinc-700" />
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm w-64">
            <div className="mb-4 flex justify-center">
              <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <Lock className="h-6 w-6 text-zinc-400" />
              </div>
            </div>
            <div className="font-bold text-zinc-100 mb-1">Edge Proxy</div>
            <div className="text-xs text-zinc-500">Inject Encrypted Token</div>
          </div>
          <div className="hidden md:block h-px w-16 bg-zinc-700" />
          <div className="md:hidden h-8 w-px bg-zinc-700" />
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm w-64">
            <div className="mb-4 flex justify-center">
              <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <Github className="h-6 w-6 text-zinc-400" />
              </div>
            </div>
            <div className="font-bold text-zinc-100 mb-1">GitHub API</div>
            <div className="text-xs text-zinc-500">Repository Read/Write</div>
          </div>
        </div>
        <p className="mt-8 text-zinc-400 max-w-2xl mx-auto">
          We use the{" "}
          <strong className="text-zinc-300">API Proxy Pattern</strong>. Your
          GitHub Access Token is encrypted and stored securely, never exposed to
          the client.
        </p>
      </section>

      {/* Technical Specs */}
      <section className="border-y border-zinc-800 bg-zinc-950 py-12">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center md:text-left">
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Offline Support
              </h3>
              <p className="text-sm font-semibold text-zinc-300">
                Full Read/Write w/o Network
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Storage Limit
              </h3>
              <p className="text-sm font-semibold text-zinc-300">
                GitHub Repo Size (100GB+)
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Encryption
              </h3>
              <p className="text-sm font-semibold text-zinc-300">
                AES-256 Token Encryption
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Tech Stack
              </h3>
              <p className="text-sm font-semibold text-zinc-300">
                Next.js 15, Dexie, Workers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="bg-zinc-900/50 py-24 md:py-32 border-y border-zinc-800">
        <div className="container max-w-3xl mx-auto space-y-12">
          <h2 className="text-3xl font-bold tracking-tight text-center text-white">
            FAQ
          </h2>
          <div className="grid gap-8">
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-white">
                Does it support offline writing?
              </h3>
              <p className="text-zinc-300">
                <strong className="text-zinc-200">Yes.</strong> Marlin is{" "}
                <strong className="text-zinc-200">Local-First</strong> by
                design. Your notes live in IndexedDB on your device, meaning you
                can search, write, and edit with{" "}
                <strong className="text-zinc-200">0ms latency</strong> even
                without an internet connection. Changes sync automatically to
                GitHub once you are back online.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-white">
                Where is my data stored?
              </h3>
              <p className="text-zinc-300">
                Your data lives in{" "}
                <strong className="text-zinc-200">
                  your own GitHub private repository
                </strong>
                . We do not host, scan, or sell your notes. Marlin acts as a
                privacy-focused interface for your Git repo. Even if Marlin
                shuts down tomorrow, your data remains safe in your GitHub
                account.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-white">
                What if I hit GitHub API rate limits?
              </h3>
              <p className="text-zinc-300">
                It&apos;s highly unlikely. Marlin writes to your local database
                first and batches syncs intelligently. We also use ETag caching
                to prevent unnecessary requests. You can write thousands of
                notes without worrying about API quotas.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-white">
                Can I export my data?
              </h3>
              <p className="text-zinc-300">
                You don&apos;t need to &quot;export.&quot; Since Marlin syncs
                directly to your repository, your notes are already stored as
                standard{" "}
                <strong className="text-zinc-200">Markdown files</strong>. You
                can `git clone` your repo anytime and open them in VS Code,
                Obsidian, or any text editor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Pre-Footer */}
      <section className="container max-w-7xl mx-auto py-24 md:py-32 text-center space-y-8">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
          Ready to reclaim your notes?
        </h2>
        <p className="text-xl text-zinc-300">
          Join the developers who choose data sovereignty.
        </p>
        <SignInButton size="lg">Initialize Your Space</SignInButton>
      </section>
    </>
  );
}
