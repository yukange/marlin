import { DarkLayout } from "@/components/layout/dark-layout"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DarkLayout>{children}</DarkLayout>
}
