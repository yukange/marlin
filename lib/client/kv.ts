/**
 * Cloudflare KV Client
 *
 * Provides typed access to the MARLIN_LICENSE_KV namespace for storing
 * user license/Pro status.
 *
 * Uses @opennextjs/cloudflare's getCloudflareContext() to access bindings.
 * In local development with `npm run preview`, it uses local simulation.
 * 
 * Key format: github:{githubId} (allows future support for gitlab:{id}, etc.)
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

// KVNamespace interface for type compatibility
interface KVNamespaceType {
    get(key: string, type: 'json'): Promise<unknown>
    get(key: string): Promise<string | null>
    put(key: string, value: string): Promise<void>
    delete(key: string): Promise<void>
}

/**
 * License data stored in KV
 */
export interface StoredLicense {
    /** Whether user has Pro access */
    isPro: boolean
    /** Plan type */
    plan?: 'monthly' | 'yearly' | 'lifetime'
    /** Creem Customer ID for portal access */
    customerId?: string
    /** Creem Subscription ID */
    subscriptionId?: string
    /** When the license was granted (ISO string) */
    grantedAt: string
    /** When the license expires (ISO string, undefined for lifetime) */
    expiresAt?: string
    /** Last updated timestamp (ISO string) */
    updatedAt: string
}

/**
 * Get KV namespace from Cloudflare context
 */
export function getLicenseKV(): KVNamespaceType | null {
    try {
        const ctx = getCloudflareContext()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const kv = (ctx.env as any).MARLIN_LICENSE_KV
        if (!kv) {
            console.warn('[kv] MARLIN_LICENSE_KV not found in env')
            return null
        }
        return kv as KVNamespaceType
    } catch (error) {
        // Not running in Cloudflare environment
        console.warn('[kv] Not in Cloudflare environment:', error)
        return null
    }
}

/**
 * Get license by GitHub ID
 */
export async function getLicense(githubId: string): Promise<StoredLicense | null> {
    const kv = getLicenseKV()
    if (!kv) return null

    try {
        const key = `github:${githubId}`
        const data = await kv.get(key, 'json')
        return data as StoredLicense | null
    } catch (error) {
        console.error('[kv] Failed to get license:', error)
        return null
    }
}

/**
 * Set license for a user
 */
export async function setLicense(
    githubId: string,
    license: StoredLicense
): Promise<boolean> {
    const kv = getLicenseKV()
    if (!kv) return false

    const now = new Date().toISOString()
    const data: StoredLicense = {
        ...license,
        updatedAt: now,
    }

    try {
        const key = `github:${githubId}`
        await kv.put(key, JSON.stringify(data))
        return true
    } catch (error) {
        console.error('[kv] Failed to set license:', error)
        return false
    }
}

/**
 * Revoke license for a user
 */
export async function revokeLicense(githubId: string): Promise<boolean> {
    const kv = getLicenseKV()
    if (!kv) return false

    const now = new Date().toISOString()
    const data: StoredLicense = {
        isPro: false,
        grantedAt: now,
        updatedAt: now,
    }

    try {
        const key = `github:${githubId}`
        await kv.put(key, JSON.stringify(data))
        return true
    } catch (error) {
        console.error('[kv] Failed to revoke license:', error)
        return false
    }
}
