import { getGistContent } from '@/lib/services/share-service'
import { SharedNoteViewer } from '@/components/share/shared-note-viewer'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface SharePageProps {
  params: Promise<{ id: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params
  const content = await getGistContent(id)

  if (!content) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
        <div className="container max-w-3xl mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image src="/logo-light.svg" alt="Marlin" width={24} height={24} className="hidden dark:block h-6 w-6 flex-shrink-0" />
            <Image src="/logo-dark.svg" alt="Marlin" width={24} height={24} className="block dark:hidden h-6 w-6 flex-shrink-0" />
            <Image src="/text-logo-light.svg" alt="Marlin" width={100} height={28} className="hidden dark:block h-7" />
            <Image src="/text-logo-dark.svg" alt="Marlin" width={100} height={28} className="block dark:hidden h-7" />
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                Create your own
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8 md:py-12">
        <SharedNoteViewer content={content} />
        
        <footer className="mt-12 text-center text-sm text-zinc-500">
          <p>Published with <Link href="/" className="font-medium hover:text-zinc-900 dark:hover:text-zinc-300 underline underline-offset-4">Marlin Notes</Link></p>
        </footer>
      </main>
    </div>
  )
}
