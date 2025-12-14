import { DarkLayout } from "@/components/layout/dark-layout"

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DarkLayout>{children}</DarkLayout>
}
