"use client"

import * as React from "react"

interface SidebarContextType {
  showNewSpace: boolean
  setShowNewSpace: (show: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [showNewSpace, setShowNewSpace] = React.useState(false)

  return (
    <SidebarContext.Provider value={{ showNewSpace, setShowNewSpace }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider")
  }
  return context
}
