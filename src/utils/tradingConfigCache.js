import { tradingFetch, getTradingAccessToken } from './tradingTokenManager';

/**
 * Advanced Trading Configuration Manager
 * 
 * Provides high-performance caching for trading symbols, leverage, and instrument configurations.
 * Features:
 * - Request Coalescing: Prevents multiple simultaneous API calls.
 * - Hybrid Caching: O(1) in-memory access + persistent localStorage.
 * - Version Awareness: Only triggers UI updates when server-side config actually changes.
 */

const TRADING_CONFIG_CACHE_KEY = 'trading_config';
const TRADING_CONFIG_VERSION_KEY = 'trading_config_version';
const API_URL = 'https://v3.livefxhub.com:8444/api/live/trading-config';

let _configPromise = null;
let _inMemoryConfig = null;

export const tradingConfigManager = {
    /**
     * Retrieves the trading configuration.
     * @param {boolean} force - Force a fresh fetch from the server.
     * @returns {Promise<Object|null>} The trading configuration data.
     */
    async getConfig(force = false) {
        // 1. Immediate In-Memory Return
        if (!force && _inMemoryConfig) return _inMemoryConfig;

        // 2. Request Coalescing: Return existing promise if fetch is already in flight
        if (_configPromise) return _configPromise;

        _configPromise = (async () => {
            const token = getTradingAccessToken();
            if (!token) {
                console.warn('[TradingConfig] No trading token found. Skipping fetch.');
                return null;
            }

            // 3. Persistent Cache Check
            if (!force) {
                try {
                    const cached = localStorage.getItem(TRADING_CONFIG_CACHE_KEY);
                    if (cached) {
                        _inMemoryConfig = JSON.parse(cached);
                        console.log('[TradingConfig] Loaded from persistent cache.');
                        
                        // Background refresh to ensure consistency without blocking UI
                        this.refreshInBackground();
                        return _inMemoryConfig;
                    }
                } catch (e) {
                    console.warn('[TradingConfig] Cache read error, falling back to network.');
                }
            }

            return this.fetchFreshConfig();
        })();

        try {
            return await _configPromise;
        } finally {
            _configPromise = null;
        }
    },

    /**
     * Fetches fresh data from the API and updates all cache layers.
     */
    async fetchFreshConfig() {
        try {
            console.log('[TradingConfig] Syncing with server...');
            const response = await tradingFetch(API_URL, { method: 'GET' });
            
            if (!response.ok) {
                console.error(`[TradingConfig] API returned error: ${response.status}`);
                return null;
            }
            
            const result = await response.json();
            if (result.success && result.data) {
                const newConfig = result.data;
                const oldVersion = localStorage.getItem(TRADING_CONFIG_VERSION_KEY);

                // Update Cache Layers
                _inMemoryConfig = newConfig;
                localStorage.setItem(TRADING_CONFIG_CACHE_KEY, JSON.stringify(newConfig));
                if (newConfig.version) {
                    localStorage.setItem(TRADING_CONFIG_VERSION_KEY, newConfig.version);
                }

                // Precision Event Dispatch: Only notify if the config version has changed
                if (newConfig.version !== oldVersion) {
                    console.log(`[TradingConfig] Configuration updated to version: ${newConfig.version}`);
                    window.dispatchEvent(new CustomEvent('tradingConfigUpdated', { detail: newConfig }));
                }

                return newConfig;
            }
        } catch (error) {
            console.error('[TradingConfig] Sync failed:', error);
        }
        return null;
    },

    /**
     * Triggers a fetch in the background without blocking the caller.
     */
    async refreshInBackground() {
        if (_configPromise) return; // Already syncing
        setTimeout(() => this.fetchFreshConfig(), 100); // Small delay to avoid race conditions during boot
    }
};
