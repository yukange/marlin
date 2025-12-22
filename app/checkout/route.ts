/**
 * Checkout Route
 *
 * Handles checkout redirects to Creem payment page.
 * Uses the Next.js Adapter for seamless integration.
 *
 * Usage:
 * - GET /api/checkout?product_id=xxx&reference_id=github_user_id
 *
 * The reference_id should be the GitHub user ID to link the purchase
 * to the user's account.
 */
import { Checkout } from '@creem_io/nextjs'

// Determine test mode from API key prefix (creem_test_ vs creem_live_)
const isTestMode = process.env.CREEM_API_KEY?.startsWith('creem_test_') ?? true

export const GET = Checkout({
    apiKey: process.env.CREEM_API_KEY!,
    testMode: isTestMode,
    defaultSuccessUrl: '/app?upgraded=1',
})
