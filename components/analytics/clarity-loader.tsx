"use client"

import dynamic from "next/dynamic"

const MicrosoftClarity = dynamic(
  () => import("./microsoft-clarity").then((mod) => mod.MicrosoftClarity),
  { ssr: false }
)

export function ClarityLoader() {
  return <MicrosoftClarity />
}
