import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-900/50 py-12 text-sm text-zinc-400">
      <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-6">
        <p>© 2025 Marlin. Built by Developers, for Developers.</p>
        <div className="flex gap-6">
          <Link
            href="https://github.com/yukange/marlin"
            className="hover:text-white"
          >
            Source Code
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
