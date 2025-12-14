import { DarkLayout } from "@/components/layout/dark-layout"

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DarkLayout>{children}</DarkLayout>
}
