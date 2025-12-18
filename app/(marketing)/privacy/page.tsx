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
    <div className="container max-w-2xl mx-auto px-4 py-12 md:py-20">
      <article className="prose prose-invert prose-zinc max-w-none">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">{title}</h1>
        {lastUpdated && (
          <p className="text-zinc-500 text-sm mb-12 font-medium">Last Updated: {lastUpdated}</p>
        )}

        <div className="space-y-6 leading-relaxed text-lg">
          <StaticContent content={contentWithoutTitle} />
        </div>
      </article>
    </div>
  )
}