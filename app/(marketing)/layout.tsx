import { DarkLayout } from "@/components/layout/dark-layout"
import { ClarityLoader } from "@/components/analytics/clarity-loader"
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DarkLayout>
      <ClarityLoader />
      <div className="flex min-h-screen flex-col bg-zinc-950 text-white font-sans">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </DarkLayout>
  )
}
