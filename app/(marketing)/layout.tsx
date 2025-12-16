import { DarkLayout } from "@/components/layout/dark-layout"
import { ClarityLoader } from "@/components/analytics/clarity-loader"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DarkLayout>
      <ClarityLoader />
      {children}
    </DarkLayout>
  )
}
