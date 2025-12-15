"use client"

import { useEffect } from "react"
import Clarity from "@microsoft/clarity"

export function MicrosoftClarity() {
  const clarityId = process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID

  useEffect(() => {
    if (clarityId) {
      Clarity.init(clarityId)
    }
  }, [clarityId])

  return null
}