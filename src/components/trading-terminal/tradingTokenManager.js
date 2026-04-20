/**
 * Trading Terminal Token Manager
 * 
 * Centralized refresh-token logic for the trading terminal.
 * Handles 401 / token-expired errors from both REST APIs and WebSockets
 * by calling the refresh-token endpoint, updating localStorage + cookies,
 * and notifying all subscribers (WebSocket reconnects, retry queues, etc.)
 *
 * Tokens used:
 *   - tradingAccessToken  → localStorage
 *   - tradingRefreshToken → cookie
 */

const REFRESH_URL = 'https://v3.livefxhub.com:8444/api/auth/refresh-token';

// ── Cookie helpers ──────────────────────────────────────────────
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=Strict; Secure`;
}

// ── Token getters / setters ─────────────────────────────────────
export function getTradingAccessToken() {
    return localStorage.getItem('tradingAccessToken');
}

export function getTradingRefreshToken() {
    return getCookie('tradingRefreshToken');
}

function setTradingTokens(accessToken, refreshToken) {
    if (accessToken) {
        localStorage.setItem('tradingAccessToken', accessToken);
    }
    if (refreshToken) {
        setCookie('tradingRefreshToken', refreshToken, 7);
    }
}

// ── Singleton refresh guard ─────────────────────────────────────
// Prevents multiple simultaneous refresh calls (request coalescing)
let _isRefreshing = false;
let _refreshPromise = null;
let _refreshListeners = [];

/**
 * Subscribe to be notified once a pending refresh completes.
 * Returns a Promise that resolves with the new accessToken, or null on failure.
 */
function waitForRefresh() {
    return new Promise((resolve) => {
        _refreshListeners.push(resolve);
    });
}

function notifyListeners(newToken) {
    _refreshListeners.forEach(cb => cb(newToken));
    _refreshListeners = [];
}

// ── Core refresh function ───────────────────────────────────────
/**
 * Call the refresh-token API and update all stored tokens.
 * Returns the new accessToken on success, or null on failure.
 *
 * If a refresh is already in-flight, callers automatically queue and
 * receive the result of the ongoing refresh (request coalescing).
 */
export async function refreshTradingToken() {
    // If already refreshing, queue behind the in-flight request
    if (_isRefreshing) {
        console.log('[TradingTokenManager] Refresh already in-flight, queuing...');
        return waitForRefresh();
    }

    const refreshToken = getTradingRefreshToken();
    const currentAccessToken = getTradingAccessToken();

    if (!refreshToken) {
        console.warn('[TradingTokenManager] No tradingRefreshToken found — cannot refresh');
        return null;
    }

    _isRefreshing = true;

    try {
        console.log('[TradingTokenManager] Refreshing trading tokens...');

        const response = await fetch(REFRESH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentAccessToken}`
            },
            body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
            console.error(`[TradingTokenManager] Refresh failed with status ${response.status}`);
            _isRefreshing = false;
            notifyListeners(null);
            return null;
        }

        const result = await response.json();

        if (result.success && result.data && result.data.status === 'success') {
            const { accessToken, refreshToken: newRefreshToken, sessionId } = result.data;

            // Update localStorage & cookie
            setTradingTokens(accessToken, newRefreshToken);

            // Update sessionId if provided
            if (sessionId) {
                localStorage.setItem('tradingSessionId', sessionId);
            }

            console.log('[TradingTokenManager] Tokens refreshed successfully');

            _isRefreshing = false;
            notifyListeners(accessToken);
            return accessToken;
        } else {
            console.error('[TradingTokenManager] Refresh response unsuccessful:', result);
            _isRefreshing = false;
            notifyListeners(null);
            return null;
        }
    } catch (err) {
        console.error('[TradingTokenManager] Refresh error:', err);
        _isRefreshing = false;
        notifyListeners(null);
        return null;
    }
}

// ── Utility: wrap a fetch call with automatic 401 retry ─────────
/**
 * Drop-in wrapper around fetch() that auto-retries once on 401
 * by refreshing the trading token first.
 *
 * Usage:
 *   const res = await tradingFetch('https://...', { method: 'GET' });
 */
export async function tradingFetch(url, options = {}) {
    // Inject current token
    const token = getTradingAccessToken();
    const headers = { ...(options.headers || {}) };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, { ...options, headers });

    // If 401, attempt a silent refresh and retry once
    if (response.status === 401) {
        console.log('[TradingTokenManager] 401 on fetch — attempting token refresh...');
        const newToken = await refreshTradingToken();

        if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, { ...options, headers });
        }
    }

    return response;
}

// ── WebSocket token-expired detection helpers ───────────────────
/**
 * Determines if a WebSocket close / error event indicates an expired token.
 * Servers commonly use:
 *   - close code 4401 or 4403 (custom auth codes)
 *   - close code 1008 (Policy Violation)
 *   - close reason containing "401", "expired", "unauthorized"
 */
export function isTokenExpiredWsEvent(closeEvent) {
    if (!closeEvent) return false;
    const code = closeEvent.code;
    const reason = (closeEvent.reason || '').toLowerCase();

    if (code === 4401 || code === 4403 || code === 1008) return true;
    if (reason.includes('401') || reason.includes('expired') || reason.includes('unauthorized') || reason.includes('token')) {
        return true;
    }
    return false;
}

/**
 * Checks if a parsed WebSocket message is a server-side auth error.
 * E.g. { type: "error", code: 401, message: "Token expired" }
 */
export function isTokenExpiredWsMessage(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;

    const code = parsed.code || parsed.statusCode || parsed.status;
    const msg = (parsed.message || parsed.error || parsed.reason || '').toLowerCase();
    const type = (parsed.type || '').toLowerCase();

    if (code === 401 || code === 403) return true;
    if (type === 'error' && (msg.includes('expired') || msg.includes('unauthorized') || msg.includes('401'))) return true;
    return false;
}
