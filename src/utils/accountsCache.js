/**
 * Shared accounts cache utility.
 * Returns cached accounts from localStorage if available.
 * Only fetches from the API when no cache exists (e.g. user opened deposit directly).
 */

const ACCOUNTS_CACHE_KEY = 'accounts';
const API_URL = 'https://v3.livefxhub.com:8444/api/live/accounts';

/**
 * Get accounts — cache-first strategy.
 * If localStorage has accounts, returns them immediately (no API call).
 * If cache is empty, fetches from API once and stores in cache.
 * @returns {Promise<Array>} accounts array
 */
export async function getAccounts() {
    // 1. Check cache first
    try {
        const cached = localStorage.getItem(ACCOUNTS_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch {
        // Cache corrupted, proceed to fetch
    }

    // 2. Cache is empty — fetch from API
    const token = localStorage.getItem('portalToken');
    const fingerprint = localStorage.getItem('deviceFingerprint');

    if (!token) return [];

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Device-Fingerprint': fingerprint
            }
        });
        const result = await response.json();
        if (result.success && result.data) {
            localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(result.data));
            return result.data;
        }
    } catch (error) {
        console.error('Failed to fetch accounts:', error);
    }

    return [];
}
