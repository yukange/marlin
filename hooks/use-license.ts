/**
 * License Validation Hook
 *
 * Provides client-side license validation with caching.
 *
 * Features:
 * - Periodic validation (every 10 minutes)
 * - Local caching of Pro status
 * - Graceful fallback on network errors
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { isPro, isValidating, error } = useLicense()
 *
 *   if (isPro) {
 *     return <ProFeature />
 *   }
 *   return <FreeFeature />
 * }
 * ```
 */
import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { useSession } from 'next-auth/react'

/** Validation interval in milliseconds (10 minutes) */
const VALIDATION_INTERVAL = 10 * 60 * 1000

/** Minimum time between validations to prevent spam (1 minute) */
const MIN_VALIDATION_INTERVAL = 60 * 1000

/**
 * License status returned by the API
 */
interface LicenseResponse {
    isPro: boolean
    plan?: 'monthly' | 'yearly' | 'lifetime'
    expiresAt?: number
    validatedAt: number
    error?: string
}

/**
 * Hook return type
 */
interface UseLicenseResult {
    /** Whether the user has Pro access */
    isPro: boolean
    /** The specific plan type if Pro */
    plan?: 'monthly' | 'yearly' | 'lifetime'
    /** Whether validation is in progress */
    isValidating: boolean
    /** Last validation error */
    error: string | null
    /** Manually trigger validation */
    validate: () => Promise<void>
}

/**
 * Hook for managing license validation
 *
 * Automatically validates the user's license on mount and periodically.
 */
export function useLicense(): UseLicenseResult {
    const { data: session, status } = useSession()
    const {
        isPro,
        proValidatedAt,
        proPlan,
        setProStatus,
    } = useStore()

    const [isValidating, setIsValidating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /**
     * Check if validation is needed based on last validation time
     */
    const shouldValidate = useCallback(() => {
        // Skip if not authenticated
        if (status !== 'authenticated' || !session?.user?.id) return false

        // Never validated before
        if (!proValidatedAt) return true

        // Check if enough time has passed
        const timeSinceLastValidation = Date.now() - proValidatedAt
        return timeSinceLastValidation > VALIDATION_INTERVAL
    }, [status, session?.user?.id, proValidatedAt])

    /**
     * Perform license validation
     */
    const validate = useCallback(async () => {
        // Prevent validation spam
        if (proValidatedAt && Date.now() - proValidatedAt < MIN_VALIDATION_INTERVAL) {
            return
        }

        setIsValidating(true)
        setError(null)

        try {
            const response = await fetch('/api/license/check')

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const data: LicenseResponse = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            setProStatus(data.isPro, data.validatedAt, data.plan)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Validation failed'
            console.error('[useLicense] Validation error:', message)
            setError(message)

            // On error, keep current status but don't update timestamp
            // This allows retry on next interval
        } finally {
            setIsValidating(false)
        }
    }, [proValidatedAt, setProStatus])

    /**
     * Effect: Initial validation and periodic checks
     */
    useEffect(() => {
        // Skip if not authenticated
        if (status !== 'authenticated') return

        // Initial validation if needed
        if (shouldValidate()) {
            validate()
        }

        // Set up periodic validation
        const interval = setInterval(() => {
            if (shouldValidate()) {
                validate()
            }
        }, VALIDATION_INTERVAL)

        return () => clearInterval(interval)
    }, [status, shouldValidate, validate])

    /**
     * Effect: Re-validate when window regains focus (tab switch)
     */
    useEffect(() => {
        const handleFocus = () => {
            if (shouldValidate()) {
                validate()
            }
        }

        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [shouldValidate, validate])

    return {
        isPro,
        plan: proPlan,
        isValidating,
        error,
        validate,
    }
}

/**
 * Hook to check if user can use Pro features
 *
 * Simpler version that just returns a boolean.
 * Use useLicense() for more details.
 */
export function useIsPro(): boolean {
    const { isPro } = useLicense()
    return isPro
}
