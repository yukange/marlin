/**
 * Customer Portal Route
 *
 * Redirects users to the Creem customer portal where they can:
 * - View subscription details
 * - Update payment method
 * - Cancel subscription
 *
 * Usage:
 * - GET /api/portal?customer_id=xxx
 *
 * The customer_id is the Creem customer ID linked to the user.
 */
import { Portal } from '@creem_io/nextjs'

export const GET = Portal({
    apiKey: process.env.CREEM_API_KEY!,
    testMode: process.env.NODE_ENV !== 'production',
})
