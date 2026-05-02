import { getTradingAccessToken } from './tradingTokenManager';
import { ordersManager } from './ordersCache';

/**
 * WebSocket Manager for Trading Orders
 * 
 * Handles real-time updates for open positions and pending orders.
 * Features:
 * - Automatic reconnection with exponential backoff.
 * - Authenticates on connect using the trading access token.
 * - Ping/pong keepalive (optional, if required by server).
 * - Feeds data directly into the high-performance ordersCache.
 */

const WS_URL = 'wss://v3.livefxhub.com:8444/ws/trading';
const RECONNECT_BASE_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

class OrdersWebSocketManager {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.isIntentionalClose = false;
        this.isConnected = false;
        this.isAuthenticated = false;
        this.authTimeout = null;
    }

    /**
     * Connects to the WebSocket. Should be called after the initial snapshot is loaded.
     */
    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const token = getTradingAccessToken();
        if (!token) {
            console.warn('[OrdersWS] Cannot connect: No trading token available.');
            return;
        }

        this.isIntentionalClose = false;
        this.isAuthenticated = false;
        console.log(`[OrdersWS] Connecting to ${WS_URL}...`);

        try {
            this.ws = new WebSocket(WS_URL);

            this.ws.onopen = () => {
                console.log('[OrdersWS] Connected. Authenticating...');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // 1. Send initial auth message MUST be first
                const authMessage = {
                    action: 'AUTH',
                    token: token
                };
                this.ws.send(JSON.stringify(authMessage));
                console.log('[OrdersWS] Sent AUTH message with token.');

                // 2. Start 10-second authentication timeout
                this._startAuthTimeout();
            };

            this.ws.onmessage = (event) => {
                try {
                    // Sometimes pings are sent as raw strings
                    if (event.data === 'PING') {
                        this.ws.send('PONG');
                        return;
                    }

                    const data = JSON.parse(event.data);
                    
                    // Handle Gateway PING -> Client PONG heartbeat
                    if (data.type === 'PING' || data.action === 'PING') {
                        this.ws.send(JSON.stringify({ action: 'PONG' }));
                        return;
                    }

                    // Handle AUTH_SUCCESS
                    if (data.type === 'AUTH_SUCCESS') {
                        console.log('[OrdersWS] Authenticated successfully:', data.data);
                        this.isAuthenticated = true;
                        this._clearAuthTimeout();
                        return;
                    }

                    // Handle Order/Modify/Cancel/Close Results
                    if (data.type === 'ORDER_RESULT' || 
                        data.type === 'MODIFY_ORDER_RESULT' || 
                        data.type === 'CANCEL_ORDER_RESULT' || 
                        data.type === 'CLOSE_ORDER_RESULT' ||
                        (data.type === 'ORDER_STATE_CHANGE' && 
                            (data.data?.status === 'MODIFIED' || data.data?.status === 'CANCELLED' || data.data?.status === 'CLOSED'))) {
                        
                        console.log(`[OrdersWS] Result (${data.type}):`, data.data);
                        
                        // For ORDER_STATE_CHANGE, we synthesize a success result
                        let resultData = data.data;
                        if (data.type === 'ORDER_STATE_CHANGE') {
                            let msg = 'Order updated';
                            if (data.data.status === 'MODIFIED') msg = 'SL/TP updated successfully';
                            else if (data.data.status === 'CANCELLED') msg = 'Order cancelled successfully';
                            else if (data.data.status === 'CLOSED') msg = 'Order closed successfully';
                            
                            resultData = { success: true, message: msg, ticket_id: data.data.ticket_id || data.data.orderId };
                        }

                        window.dispatchEvent(new CustomEvent('orderResult', { detail: resultData }));
                        
                        // If it's a result message, we can return. 
                        // But if it's a state change, we MUST also fall through to update the cache.
                        if (data.type !== 'ORDER_STATE_CHANGE') return;
                    }

                    // Handle PORTFOLIO_UPDATE
                    if (data.type === 'PORTFOLIO_UPDATE') {
                        console.log('[OrdersWS] Portfolio Update:', data.data);
                        import('./portfolioCache').then(({ portfolioManager }) => {
                            portfolioManager.updateFromWebSocket(data.data);
                        });
                        return;
                    }

                    // Process standard open/pending order updates if authenticated
                    if (this.isAuthenticated) {
                        ordersManager.updateFromWebSocket(data);
                    }
                    
                } catch (err) {
                    console.error('[OrdersWS] Failed to parse message:', err);
                }
            };

            this.ws.onclose = (event) => {
                this.isConnected = false;
                this.isAuthenticated = false;
                this._clearAuthTimeout();
                
                if (this.isIntentionalClose) {
                    console.log('[OrdersWS] Disconnected intentionally.');
                } else {
                    console.warn(`[OrdersWS] Disconnected un-intentionally (Code: ${event.code}). Reconnecting...`);
                    this._scheduleReconnect();
                }
            };

            this.ws.onerror = (error) => {
                console.error('[OrdersWS] WebSocket error:', error);
                // The onclose event will fire immediately after onerror, handling reconnection.
            };

        } catch (err) {
            console.error('[OrdersWS] Connection failed to establish:', err);
            this._scheduleReconnect();
        }
    }

    /**
     * Sends a new order request through the websocket.
     * @param {Object} payload The order details
     * @returns {boolean} True if sent successfully
     */
    sendOrder(payload) {
        if (!this.isAuthenticated || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('[OrdersWS] Cannot send order. Not connected or not authenticated.');
            return false;
        }

        const msg = {
            action: 'PLACE_ORDER',
            payload: payload
        };
        this.ws.send(JSON.stringify(msg));
        console.log('[OrdersWS] Sent PLACE_ORDER:', msg);
        return true;
    }

    /**
     * Sends a cancel order request through the websocket.
     * @param {string} ticketId The order ID to cancel
     * @returns {boolean} True if sent successfully
     */
    /**
     * Ensures the WebSocket is connected before sending an action.
     * @returns {boolean} True if connected/connecting
     */
    ensureConnected() {
        if (!this.ws || (this.ws.readyState !== WebSocket.OPEN && this.ws.readyState !== WebSocket.CONNECTING)) {
            console.log('[OrdersWS] Connection missing or closed. Attempting to connect...');
            this.connect();
            return false;
        }
        return true;
    }

    /**
     * Sends a cancel order request through the websocket.
     * @param {string} ticketId The order ID to cancel
     * @returns {boolean} True if sent successfully
     */
    cancelOrder(ticketId) {
        this.ensureConnected();
        
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('[OrdersWS] Cannot cancel order: WebSocket is not connected.', { readyState: this.ws?.readyState });
            return false;
        }

        if (!this.isAuthenticated) {
            console.error('[OrdersWS] Cannot cancel order: WebSocket is connected but not yet authenticated.');
            return false;
        }

        const msg = {
            action: 'CANCEL_ORDER',
            payload: {
                ticket_id: String(ticketId)
            }
        };
        this.ws.send(JSON.stringify(msg));
        console.log('[OrdersWS] Sent CANCEL_ORDER:', msg);
        return true;
    }

    /**
     * Sends a modify order request through the websocket.
     * @param {Object} payload { ticket_id, new_sl, new_tp }
     * @returns {boolean} True if sent successfully
     */
    modifyOrder(payload) {
        this.ensureConnected();

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('[OrdersWS] Cannot modify order: WebSocket is not connected.', { readyState: this.ws?.readyState });
            return false;
        }

        if (!this.isAuthenticated) {
            console.error('[OrdersWS] Cannot modify order: WebSocket is connected but not yet authenticated.');
            return false;
        }

        const msg = {
            action: 'MODIFY_ORDER',
            payload: {
                ticket_id: String(payload.ticket_id),
                new_sl: parseFloat(payload.new_sl || 0),
                new_tp: parseFloat(payload.new_tp || 0)
            }
        };
        this.ws.send(JSON.stringify(msg));
        console.log('[OrdersWS] Sent MODIFY_ORDER:', msg);
        return true;
    }

    /**
     * Sends a close order request through the websocket.
     * @param {string} ticketId The order ID to close
     * @returns {boolean} True if sent successfully
     */
    closeOrder(ticketId) {
        this.ensureConnected();

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('[OrdersWS] Cannot close order: WebSocket is not connected.', { readyState: this.ws?.readyState });
            return false;
        }

        if (!this.isAuthenticated) {
            console.error('[OrdersWS] Cannot close order: WebSocket is connected but not yet authenticated.');
            return false;
        }

        const msg = {
            action: 'CLOSE_ORDER',
            payload: {
                ticket_id: String(ticketId)
            }
        };
        this.ws.send(JSON.stringify(msg));
        console.log('[OrdersWS] Sent CLOSE_ORDER:', msg);
        return true;
    }

    /**
     * Disconnects the WebSocket intentionally.
     */
    disconnect() {
        this.isIntentionalClose = true;
        this._clearAuthTimeout();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.isAuthenticated = false;
    }

    _scheduleReconnect() {
        if (this.isIntentionalClose) return;

        // Exponential backoff
        const delay = Math.min(
            RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts),
            MAX_RECONNECT_DELAY
        );

        console.log(`[OrdersWS] Reconnecting in ${delay}ms...`);
        this.reconnectAttempts++;

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    _startAuthTimeout() {
        this._clearAuthTimeout();
        this.authTimeout = setTimeout(() => {
            if (!this.isAuthenticated && this.ws) {
                console.error('[OrdersWS] Authentication timeout (10s). Closing connection.');
                this.ws.close(); // Triggers onclose -> reconnects
            }
        }, 10000);
    }

    _clearAuthTimeout() {
        if (this.authTimeout) {
            clearTimeout(this.authTimeout);
            this.authTimeout = null;
        }
    }
}

export const ordersWebSocket = new OrdersWebSocketManager();
