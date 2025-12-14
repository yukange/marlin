import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import privacyContent from "@/content/privacy.md"
import { StaticContent } from "@/components/static-content"

export const dynamic = 'force-static'

export default async function PrivacyPage() {
  const fileContent = privacyContent
  
  // Parse metadata from markdown
  const lines = fileContent.split("\n")
  const titleLine = lines.find((line: string) => line.startsWith("# "))
  const title = titleLine?.replace("# ", "") || "Privacy Policy"
  
  const lastUpdatedLine = lines.find((line: string) => line.includes("Last Updated"))
  const lastUpdated = lastUpdatedLine?.replace(/\*\*Last Updated:\*\*\s*/, "") || ""
  
  // Get content without the title
  const contentWithoutTitle = fileContent.replace(/^# .+\n\n/, "")

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="container max-w-3xl mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image src="/logo-light.svg" alt="Marlin" width={24} height={24} className="h-6 w-6 flex-shrink-0" />
            <Image src="/text-logo-light.svg" alt="Marlin" width={100} height={28} className="h-7" />
          </Link>
          <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white hover:bg-zinc-800">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-12 md:py-20">
        <article className="prose prose-invert prose-zinc max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">{title}</h1>
          {lastUpdated && (
            <p className="text-zinc-500 text-sm mb-12 font-medium">Last Updated: {lastUpdated}</p>
          )}

          <div className="space-y-6 leading-relaxed text-lg">
            <StaticContent content={contentWithoutTitle} />
          </div>
        </article>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-12 mt-12">
        <div className="container max-w-3xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>© 2025 Marlin. All rights reserved.</p>
          <a href="mailto:support@marlinnotes.com" className="hover:text-zinc-300 transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  )
}
