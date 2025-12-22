/**
 * License Check API
 *
 * Returns the current user's license/Pro status.
 * Called by the client-side useLicense hook for periodic validation.
 *
 * Reads license data from Cloudflare KV (set by webhooks).
 * Key format: license:{githubId}
 * Requires authentication via next-auth session.
 *
 * Response:
 * - { isPro: boolean, plan?: string, expiresAt?: number, validatedAt: number }
 */
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { getLicense } from '@/lib/client/kv'

export async function GET() {
    const now = Date.now()

    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { isPro: false, error: 'Not authenticated', validatedAt: now },
                { status: 401 }
            )
        }

        const license = await getLicense(session.user.id)

        if (license) {
            return NextResponse.json({
                isPro: license.isPro,
                plan: license.plan,
                expiresAt: license.expiresAt ? new Date(license.expiresAt).getTime() : undefined,
                validatedAt: now,
            })
        }

        return NextResponse.json({
            isPro: false,
            validatedAt: now,
        })
    } catch (error) {
        console.error('[license/check] Error:', error)
        return NextResponse.json(
            { isPro: false, error: 'Failed to check license', validatedAt: now },
            { status: 500 }
        )
    }
}
