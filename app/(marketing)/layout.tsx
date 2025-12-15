import { DarkLayout } from "@/components/layout/dark-layout"
import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DarkLayout>
      <MicrosoftClarity />
      {children}
    </DarkLayout>
  )
}
