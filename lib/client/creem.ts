/**
 * Creem API Client
 *
 * Centralized Creem SDK configuration.
 * Used by license-service for API calls.
 *
 * This module provides a singleton instance of the Creem TypeScript SDK,
 * configured with the API key from environment variables.
 */
import { createCreem } from 'creem_io'

// Lazy initialization to avoid build-time errors
let _creemInstance: ReturnType<typeof createCreem> | null = null

/**
 * Get the Creem SDK instance.
 * Lazily initialized to avoid build-time errors when env vars are not set.
 */
export function getCreemClient() {
    if (!_creemInstance) {
        if (!process.env.CREEM_API_KEY) {
            throw new Error('CREEM_API_KEY environment variable is required')
        }

        _creemInstance = createCreem({
            apiKey: process.env.CREEM_API_KEY,
            // Determine test mode from API key prefix (creem_test_ vs creem_live_)
            testMode: process.env.CREEM_API_KEY.startsWith('creem_test_'),
        })
    }

    return _creemInstance
}

/**
 * Creem SDK instance (for direct access when needed)
 * Note: Prefer using getCreemClient() for lazy initialization
 */
export const creem = {
    get instance() {
        return getCreemClient()
    },
}
