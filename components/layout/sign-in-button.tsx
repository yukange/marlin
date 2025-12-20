'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Github, Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

interface SignInButtonProps {
  variant?: 'default' | 'primary'
  size?: 'sm' | 'lg'
  children?: React.ReactNode
}

export function SignInButton({ variant = 'default', size = 'sm', children }: SignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('github', { callbackUrl: '/app' })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  if (variant === 'primary') {
    return (
      <div className="flex flex-col items-center gap-3">
        <Button
          size={size}
          onClick={handleSignIn}
          disabled={isLoading}
          className="h-12 px-8 rounded-full text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Connecting to GitHub...
            </>
          ) : (
            children || 'Start Writing for Free'
          )}
        </Button>
        <p className="text-xs text-zinc-500">
          By signing in, you agree to our{' '}
          <Link href="/privacy" className="underline hover:text-zinc-300 transition-colors">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="underline hover:text-zinc-300 transition-colors">
            Terms of Service
          </Link>
        </p>
      </div>
    )
  }

  return (
    <Button
      size={size}
      onClick={handleSignIn}
      disabled={isLoading}
      className="gap-2 rounded-full text-zinc-950 hover:bg-zinc-200 disabled:opacity-70"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <Github className="h-4 w-4" />
          {children || 'Sign in with GitHub'}
        </>
      )}
    </Button>
  )
}
