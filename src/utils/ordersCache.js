import { tradingFetch, getTradingAccessToken } from './tradingTokenManager';

/**
 * Active Orders Cache Manager
 * 
 * High-performance caching layer for the /api/orders/active endpoint.
 * Features:
 * - Request Coalescing: Prevents duplicate in-flight API calls.
 * - Hybrid Caching: O(1) in-memory access + persistent localStorage fallback.
 * - Event-Driven Updates: Dispatches 'ordersUpdated' for reactive UI bindings.
 * - Separates open_positions and pending_orders from a single API response.
 */

const ORDERS_CACHE_KEY = 'orders_active';
const ORDERS_TIMESTAMP_KEY = 'orders_active_ts';
const API_URL = 'https://v3.livefxhub.com:8444/api/orders/active';
const CACHE_TTL_MS = 30_000; // 30s — orders data refreshes more frequently

let _fetchPromise = null;
let _inMemoryOrders = null;

/**
 * Default shape returned when no data is available yet.
 */
const DEFAULT_ORDERS = {
    open_positions: [],
    pending_orders: [],
};

/**
 * Normalizes a single open position from the API response
 * into the shape expected by the OrdersPanel UI.
 */
function normalizeOpenPosition(pos) {
    return {
        orderId: pos.ticket_id || pos.orderId || '',
        symbolName: pos.symbol || pos.symbolName || '',
        orderTime: pos.order_time || pos.open_time || pos.orderTime || null,
        orderType: (pos.order_side || pos.side || pos.orderType || '').toUpperCase(),
        quantity: parseFloat(pos.volume || pos.quantity) || 0,
        openPrice: parseFloat(pos.open_price || pos.openPrice) || 0,
        marketPrice: parseFloat(pos.market_price || pos.marketPrice) || 0,
        commission: parseFloat(pos.commission) || 0,
        swap: parseFloat(pos.swap) || 0,
        stopLoss: pos.sl ?? pos.stopLoss ?? null,
        takeProfit: pos.tp ?? pos.takeProfit ?? null,
        profitLoss: parseFloat(pos.profit_loss || pos.profitLoss) || 0,
    };
}

/**
 * Normalizes a single pending order from the API response
 * into the shape expected by the OrdersPanel UI.
 */
function normalizePendingOrder(ord) {
    return {
        orderId: ord.ticket_id || ord.orderId || '',
        symbolName: ord.symbol || ord.symbolName || '',
        orderTime: ord.order_time || ord.open_time || ord.orderTime || null,
        orderType: (ord.order_type || ord.orderType || ord.order_side || ord.side || '').toUpperCase(),
        quantity: parseFloat(ord.volume || ord.quantity) || 0,
        openPrice: parseFloat(ord.requested_price || ord.open_price || ord.openPrice || ord.price) || 0,
        marketPrice: parseFloat(ord.market_price || ord.marketPrice) || 0,
    };
}

export const ordersManager = {
    /**
     * Retrieves the active orders (open positions + pending orders).
     * @param {boolean} force - Force a fresh fetch from the server, bypassing cache.
     * @returns {Promise<Object>} { open_positions: [...], pending_orders: [...] }
     */
    async getOrders(force = false) {
        // 1. Immediate In-Memory Return (hot path)
        if (!force && _inMemoryOrders && !this._isStale()) {
            return _inMemoryOrders;
        }

        // 2. Request Coalescing — return existing promise if fetch is in-flight
        if (_fetchPromise) return _fetchPromise;

        _fetchPromise = (async () => {
            const token = getTradingAccessToken();
            if (!token) {
                console.warn('[OrdersCache] No trading token found. Returning defaults.');
                return _inMemoryOrders || DEFAULT_ORDERS;
            }

            // 3. Persistent Cache Check (warm path)
            if (!force) {
                try {
                    const cached = localStorage.getItem(ORDERS_CACHE_KEY);
                    if (cached && !this._isStale()) {
                        _inMemoryOrders = JSON.parse(cached);
                        console.log('[OrdersCache] Loaded from persistent cache.');
                        // Background refresh for eventual consistency
                        this._refreshInBackground();
                        return _inMemoryOrders;
                    }
                } catch (e) {
                    console.warn('[OrdersCache] Cache read error, falling back to network.');
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
     * Fetches fresh orders data from the API and updates all cache layers.
     * @returns {Promise<Object>} Orders data or defaults on failure.
     */
    async _fetchFresh() {
        try {
            console.log('[OrdersCache] Syncing with server...');
            const response = await tradingFetch(API_URL, { method: 'GET' });

            if (!response.ok) {
                console.error(`[OrdersCache] API returned error: ${response.status}`);
                return _inMemoryOrders || DEFAULT_ORDERS;
            }

            const result = await response.json();

            // Handle both flat response and { data: { ... } } wrapper
            const data = result.data || result;

            const rawOpen = Array.isArray(data.open_positions) ? data.open_positions : [];
            const rawPending = Array.isArray(data.pending_orders) ? data.pending_orders : [];

            const orders = {
                open_positions: rawOpen.map(normalizeOpenPosition),
                pending_orders: rawPending.map(normalizePendingOrder),
            };

            // Update all cache layers
            _inMemoryOrders = orders;
            localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(orders));
            localStorage.setItem(ORDERS_TIMESTAMP_KEY, Date.now().toString());

            console.log(`[OrdersCache] Orders synced — ${orders.open_positions.length} open, ${orders.pending_orders.length} pending`);

            // Dispatch event for reactive UI components
            window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: orders }));

            return orders;
        } catch (error) {
            console.error('[OrdersCache] Sync failed:', error);
            return _inMemoryOrders || DEFAULT_ORDERS;
        }
    },

    /**
     * Updates the cache directly from a WebSocket message.
     * Merges or replaces the data depending on what the socket sends.
     */
    updateFromWebSocket(payload) {
        if (!payload) return;

        // Extract the data payload if wrapped
        const data = payload.data || payload;
        const type = payload.type || data.type;

        let orders = _inMemoryOrders ? { ..._inMemoryOrders } : { open_positions: [], pending_orders: [] };
        let updated = false;

        // Handle Single Order State Changes
        if (type === 'ORDER_STATE_CHANGE') {
            const orderData = payload.type === 'ORDER_STATE_CHANGE' ? payload.data : data;
            if (orderData) {
                if (orderData.status === 'OPEN') {
                    // Optimistic insert
                    const newPos = normalizeOpenPosition(orderData);
                    if (newPos.orderId && newPos.symbolName) {
                        const existingIdx = orders.open_positions.findIndex(o => o.orderId === newPos.orderId);
                        if (existingIdx >= 0) {
                            orders.open_positions[existingIdx] = { ...orders.open_positions[existingIdx], ...newPos };
                        } else {
                            orders.open_positions = [newPos, ...orders.open_positions];
                        }
                        updated = true;
                    }
                } else if (orderData.status === 'CLOSED' || orderData.status === 'REJECTED') {
                    // Optimistic remove
                    orders.open_positions = orders.open_positions.filter(o => o.orderId !== orderData.ticket_id && o.orderId !== orderData.orderId);
                    orders.pending_orders = orders.pending_orders.filter(o => o.orderId !== orderData.ticket_id && o.orderId !== orderData.orderId);
                    updated = true;
                }
            }
            // Always background sync to ensure exact data (commission, swap, etc)
            this._refreshInBackground();
        } 
        // Handle Full Snapshot Updates
        else if (data.open_positions !== undefined || data.pending_orders !== undefined) {
            if (data.open_positions !== undefined) {
                const rawOpen = Array.isArray(data.open_positions) ? data.open_positions : [];
                orders.open_positions = rawOpen.map(normalizeOpenPosition);
                updated = true;
            }

            if (data.pending_orders !== undefined) {
                const rawPending = Array.isArray(data.pending_orders) ? data.pending_orders : [];
                orders.pending_orders = rawPending.map(normalizePendingOrder);
                updated = true;
            }
        }

        if (updated) {
            _inMemoryOrders = orders;
            localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(orders));
            localStorage.setItem(ORDERS_TIMESTAMP_KEY, Date.now().toString());
            
            console.log(`[OrdersCache] WebSocket update — ${orders.open_positions.length} open, ${orders.pending_orders.length} pending`);
            window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: orders }));
        }
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
        const ts = localStorage.getItem(ORDERS_TIMESTAMP_KEY);
        if (!ts) return true;
        return (Date.now() - parseInt(ts, 10)) > CACHE_TTL_MS;
    },

    /**
     * Force-invalidates the cache (e.g., after placing or closing an order).
     */
    invalidate() {
        _inMemoryOrders = null;
        localStorage.removeItem(ORDERS_CACHE_KEY);
        localStorage.removeItem(ORDERS_TIMESTAMP_KEY);
        console.log('[OrdersCache] Cache invalidated.');
    },

    /**
     * Returns the current in-memory snapshot without triggering a fetch.
     * Useful for synchronous reads in render paths.
     */
    getSnapshot() {
        return _inMemoryOrders || DEFAULT_ORDERS;
    },
};
