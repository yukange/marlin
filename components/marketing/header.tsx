import Link from "next/link"
import Image from "next/image"
import { SignInButton } from "@/components/layout/sign-in-button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-light.svg" alt="Marlin" width={24} height={24} className="h-6 w-6 flex-shrink-0" />
            <Image src="/text-logo-light.svg" alt="Marlin" width={100} height={28} className="h-7" />
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="https://github.com/yukange/marlin" target="_blank" className="hover:text-white transition-colors">Open Source</Link>
        </nav>
        <div className="flex items-center gap-4">
          <SignInButton size="sm" />
        </div>
      </div>
    </header>
  )
}
