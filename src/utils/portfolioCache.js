import { tradingFetch, getTradingAccessToken } from './tradingTokenManager';

/**
 * Portfolio Summary Cache Manager
 * 
 * High-performance caching layer for the /api/portfolio/summary endpoint.
 * Features:
 * - Request Coalescing: Prevents duplicate in-flight API calls.
 * - Hybrid Caching: O(1) in-memory access + persistent localStorage fallback.
 * - Event-Driven Updates: Dispatches 'portfolioUpdated' for reactive UI bindings.
 * - TTL-Based Staleness: Auto-marks cache as stale after configurable interval.
 */

const PORTFOLIO_CACHE_KEY = 'portfolio_summary';
const PORTFOLIO_TIMESTAMP_KEY = 'portfolio_summary_ts';
const API_URL = 'https://v3.livefxhub.com:8444/api/orders/portfolio';
const CACHE_TTL_MS = 60_000; // 60s — portfolio data refreshes every minute

let _fetchPromise = null;
let _inMemoryPortfolio = null;

/**
 * Default shape returned when no data is available yet.
 */
const DEFAULT_PORTFOLIO = {
    balance: 0.00,
    used_margin: 0.00,
    free_margin: 0.00,
    equity: 0.00,
    margin_level_pct: 0.0,
    leverage: 0,
};

export const portfolioManager = {
    /**
     * Retrieves the portfolio summary.
     * @param {boolean} force - Force a fresh fetch from the server, bypassing cache.
     * @returns {Promise<Object>} The portfolio summary data (always returns a valid object).
     */
    async getSummary(force = false) {
        // 1. Immediate In-Memory Return (hot path)
        if (!force && _inMemoryPortfolio && !this._isStale()) {
            return _inMemoryPortfolio;
        }

        // 2. Request Coalescing — return existing promise if fetch is in-flight
        if (_fetchPromise) return _fetchPromise;

        _fetchPromise = (async () => {
            const token = getTradingAccessToken();
            if (!token) {
                console.warn('[PortfolioCache] No trading token found. Returning defaults.');
                return _inMemoryPortfolio || DEFAULT_PORTFOLIO;
            }

            // 3. Persistent Cache Check (warm path)
            if (!force) {
                try {
                    const cached = localStorage.getItem(PORTFOLIO_CACHE_KEY);
                    if (cached && !this._isStale()) {
                        _inMemoryPortfolio = JSON.parse(cached);
                        console.log('[PortfolioCache] Loaded from persistent cache.');
                        // Background refresh for eventual consistency
                        this._refreshInBackground();
                        return _inMemoryPortfolio;
                    }
                } catch (e) {
                    console.warn('[PortfolioCache] Cache read error, falling back to network.');
                }
            }

            // 4. Network Fetch (cold path)
            return this._fetchFresh();
        })();

        try {
            return await _fetchPromise;
        } finally {
            _fetchPromise = null;
        }
    },

    /**
     * Fetches fresh portfolio data from the API and updates all cache layers.
     * @returns {Promise<Object>} Portfolio data or defaults on failure.
     */
    async _fetchFresh() {
        try {
            console.log('[PortfolioCache] Syncing with server...');
            const response = await tradingFetch(API_URL, { method: 'GET' });

            if (!response.ok) {
                console.error(`[PortfolioCache] API returned error: ${response.status}`);
                return _inMemoryPortfolio || DEFAULT_PORTFOLIO;
            }

            const result = await response.json();

            // Handle both { balance, ... } flat response and { data: { ... } } wrapper
            const data = result.data || result;

            if (data && typeof data.balance !== 'undefined') {
                const balance = parseFloat(data.balance) || 0;
                const used_margin = parseFloat(data.used_margin) || 0;
                
                let equity = parseFloat(data.equity);
                let profit = parseFloat(data.profit);
                
                // If equity is not provided, calculate it from profit or default to balance
                if (isNaN(equity)) {
                    if (!isNaN(profit)) {
                        equity = balance + profit;
                    } else {
                        equity = balance;
                        profit = 0;
                    }
                } else if (isNaN(profit)) {
                    profit = equity - balance;
                }

                let free_margin = parseFloat(data.free_margin);
                if (isNaN(free_margin)) {
                    free_margin = equity - used_margin;
                }

                let margin_level_pct = parseFloat(data.margin_level_pct);
                if (isNaN(margin_level_pct)) {
                    margin_level_pct = used_margin > 0 ? (equity / used_margin) * 100 : 0;
                }

                const portfolio = {
                    balance,
                    used_margin,
                    free_margin,
                    equity,
                    margin_level_pct,
                    profit,
                    leverage: parseInt(data.leverage, 10) || 0,
                };

                // Update all cache layers
                _inMemoryPortfolio = portfolio;
                localStorage.setItem(PORTFOLIO_CACHE_KEY, JSON.stringify(portfolio));
                localStorage.setItem(PORTFOLIO_TIMESTAMP_KEY, Date.now().toString());

                console.log('[PortfolioCache] Portfolio synced:', portfolio);

                // Dispatch event for reactive UI components
                window.dispatchEvent(new CustomEvent('portfolioUpdated', { detail: portfolio }));

                return portfolio;
            }

            console.warn('[PortfolioCache] Unexpected response shape:', result);
            return _inMemoryPortfolio || DEFAULT_PORTFOLIO;
        } catch (error) {
            console.error('[PortfolioCache] Sync failed:', error);
            return _inMemoryPortfolio || DEFAULT_PORTFOLIO;
        }
    },

    /**
     * Updates the portfolio cache directly from a WebSocket message.
     */
    updateFromWebSocket(data) {
        if (!data) return;

        // Merge with existing snapshot or defaults
        const current = _inMemoryPortfolio || DEFAULT_PORTFOLIO;
        
        const balance = typeof data.balance !== 'undefined' ? parseFloat(data.balance) : current.balance;
        const used_margin = typeof data.used_margin !== 'undefined' ? parseFloat(data.used_margin) : current.used_margin;
        
        let equity = typeof data.equity !== 'undefined' ? parseFloat(data.equity) : current.equity;
        let profit = typeof data.profit !== 'undefined' ? parseFloat(data.profit) : current.profit;
        
        // If equity is not provided by the socket, derive it
        if (typeof data.equity === 'undefined') {
            if (typeof data.profit !== 'undefined') {
                equity = balance + profit;
            } else {
                equity = balance; // or keep current.equity if we want
            }
        } else if (typeof data.profit === 'undefined') {
            profit = equity - balance;
        }

        let free_margin = typeof data.free_margin !== 'undefined' ? parseFloat(data.free_margin) : current.free_margin;
        if (typeof data.free_margin === 'undefined') {
            free_margin = equity - used_margin;
        }

        let margin_level_pct = typeof data.margin_level_pct !== 'undefined' ? parseFloat(data.margin_level_pct) : current.margin_level_pct;
        if (typeof data.margin_level_pct === 'undefined') {
            margin_level_pct = used_margin > 0 ? (equity / used_margin) * 100 : 0;
        }

        const portfolio = {
            balance,
            used_margin,
            free_margin,
            equity,
            margin_level_pct,
            profit,
            leverage: typeof data.leverage !== 'undefined' ? parseInt(data.leverage, 10) : current.leverage,
        };

        // Update all cache layers
        _inMemoryPortfolio = portfolio;
        localStorage.setItem(PORTFOLIO_CACHE_KEY, JSON.stringify(portfolio));
        localStorage.setItem(PORTFOLIO_TIMESTAMP_KEY, Date.now().toString());

        console.log('[PortfolioCache] Portfolio updated via WebSocket:', portfolio);

        // Dispatch event for reactive UI components
        window.dispatchEvent(new CustomEvent('portfolioUpdated', { detail: portfolio }));
    },

    /**
     * Non-blocking background refresh — doesn't affect current render cycle.
     */
    _refreshInBackground() {
        if (_fetchPromise) return;
        setTimeout(() => this._fetchFresh(), 150);
    },

    /**
     * Checks if the cached data has exceeded the TTL.
     */
    _isStale() {
        const ts = localStorage.getItem(PORTFOLIO_TIMESTAMP_KEY);
        if (!ts) return true;
        return (Date.now() - parseInt(ts, 10)) > CACHE_TTL_MS;
    },

    /**
     * Force-invalidates the cache (e.g., after placing an order).
     */
    invalidate() {
        _inMemoryPortfolio = null;
        localStorage.removeItem(PORTFOLIO_CACHE_KEY);
        localStorage.removeItem(PORTFOLIO_TIMESTAMP_KEY);
        console.log('[PortfolioCache] Cache invalidated.');
    },

    /**
     * Returns the current in-memory snapshot without triggering a fetch.
     * Useful for synchronous reads in render paths.
     */
    getSnapshot() {
        return _inMemoryPortfolio || DEFAULT_PORTFOLIO;
    },
};
