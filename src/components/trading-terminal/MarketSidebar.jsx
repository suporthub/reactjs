import React, { useState, useEffect, useRef } from 'react';
import { decode } from '@msgpack/msgpack';
import { Search, Star, PanelLeftClose } from 'lucide-react';
import OrderPlacementModal from './OrderPlacementModal';
import {
    getTradingAccessToken,
    refreshTradingToken,
    isTokenExpiredWsEvent,
    isTokenExpiredWsMessage
} from './tradingTokenManager';
import { tradingConfigManager } from '../../utils/tradingConfigCache';

const MARKET_DATA = [];

const CATEGORIES = ['★', 'Currencies', 'Commodities', 'Indices', 'Crypto'];

const formatPrice = (val, precision) => {
    if (val === undefined || val === null || val === '-') return val || '-';
    const num = Number(val);
    if (isNaN(num)) return val;

    if (precision !== undefined) {
        return num.toFixed(precision);
    }

    // Fallback if precision is not provided
    return Number(num.toPrecision(6)).toString();
};

export default function MarketSidebar({ selectedSymbol, setSelectedSymbol, onToggleSidebar }) {
    const [marketData, setMarketData] = useState(MARKET_DATA);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Currencies');
    const [modalData, setModalData] = useState(null);
    const [config, setConfig] = useState(null);
    const wsRef = useRef(null);
    const updatesBufferRef = useRef({});
    const marketDataMapRef = useRef(new Map()); // O(1) lookups by symbol
    const prevPricesRef = useRef({}); // Track previous bid prices for tick direction
    const isUnmountedRef = useRef(false);
    const refreshAttemptedRef = useRef(false); // Prevent infinite refresh loops
    const configRef = useRef(null);

    // ── Load Config & Initialize Symbols ──────────────────────────
    useEffect(() => {
        const loadConfig = async () => {
            const data = await tradingConfigManager.getConfig();
            if (data && data.symbols) {
                setConfig(data);
                configRef.current = data;

                // Initialize marketData with all symbols from config
                const initialDataMap = new Map();
                data.symbols.forEach(s => {
                    initialDataMap.set(s.symbol, {
                        symbol: s.symbol,
                        bid: '-',
                        ask: '-',
                        bidHigh: '-',
                        bidLow: '-',
                        change: '0.00%',
                        tickDirection: 'neutral',
                        instrumentType: s.instrumentType,
                        starred: false
                    });
                });
                marketDataMapRef.current = initialDataMap;
                setMarketData(Array.from(initialDataMap.values()));
            }
        };
        loadConfig();

        const handleConfigUpdate = (e) => {
            if (e.detail) {
                setConfig(e.detail);
                configRef.current = e.detail;
            }
        };
        window.addEventListener('tradingConfigUpdated', handleConfigUpdate);
        return () => window.removeEventListener('tradingConfigUpdated', handleConfigUpdate);
    }, []);

    useEffect(() => {
        isUnmountedRef.current = false;
        let reconnectTimer = null;
        let reconnectDelay = 1000;

        function connectWs() {
            if (isUnmountedRef.current) return;

            // Clear any pending reconnect
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }

            const token = getTradingAccessToken();
            if (!token) {
                console.warn('[MarketSidebar] No token available for connection');
                return;
            }

            // Establish connection passing token per instructions
            console.log('[MarketSidebar] Connecting WebSocket...');
            const ws = new WebSocket(`wss://v3.livefxhub.com:8444/token=${token}`);
            ws.binaryType = "arraybuffer"; // Important requirement for decoding msgpack
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log('[MarketSidebar] Connected to LiveFXHub Market Data WS');
                refreshAttemptedRef.current = false; // Reset on successful connect
                reconnectDelay = 1000; // Reset backoff

                if (ws.readyState === WebSocket.OPEN) {
                    // Fetch dynamic symbol list from the cached trading config
                    const currentConfig = configRef.current || await tradingConfigManager.getConfig();
                    const symbols = currentConfig?.symbols?.map(s => s.symbol) || [];

                    if (symbols.length > 0) {
                        console.log(`[MarketSidebar] Subscribing to ${symbols.length} symbols from config`);
                        ws.send(JSON.stringify({
                            action: "subscribe",
                            symbols: symbols
                        }));
                    }
                }
            };

            ws.onmessage = (event) => {
                try {
                    let parsed;
                    if (typeof event.data === 'string') {
                        // Handle text frames (JSON or ping)
                        parsed = JSON.parse(event.data);
                    } else if (event.data instanceof ArrayBuffer) {
                        if (event.data.byteLength === 0) return;
                        // Binary MessagePack decoding
                        parsed = decode(new Uint8Array(event.data));
                    } else {
                        return;
                    }

                    // Handle ping/pong keepalive
                    if (parsed && parsed.type === 'ping') {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ action: 'pong' }));
                        }
                        return;
                    }

                    // ── Token-expired detection on incoming server messages ──
                    if (isTokenExpiredWsMessage(parsed)) {
                        console.warn('[MarketSidebar] Server sent auth error — refreshing token...');
                        ws.close();
                        handleTokenRefreshAndReconnect();
                        return;
                    }

                    // Helper to process a single symbol's price array into the buffer
                    const processSymbolUpdate = (symbol, vals) => {
                        if (!symbol || !Array.isArray(vals)) return;

                        const existing = updatesBufferRef.current[symbol] || marketDataMapRef.current.get(symbol) || {};
                        const updateEntry = { ...existing, symbol };

                        // ── Precision handling ──
                        // Retrieve showPoints from config for consistent decimal places
                        const symbolInfo = configRef.current?.symbols?.find(s => s.symbol === symbol);
                        const precision = symbolInfo?.showPoints;

                        // Compare new bid with previous bid to determine tick direction
                        if (vals[0] !== undefined) {
                            const newBid = parseFloat(vals[0]);
                            const prevBid = prevPricesRef.current[symbol];
                            if (prevBid !== undefined) {
                                if (newBid > prevBid) {
                                    updateEntry.tickDirection = 'up';
                                } else if (newBid < prevBid) {
                                    updateEntry.tickDirection = 'down';
                                }
                                // If equal, keep the previous tickDirection
                            }
                            prevPricesRef.current[symbol] = newBid;
                            updateEntry.bid = formatPrice(vals[0], precision);
                        }

                        if (vals[1] !== undefined) updateEntry.ask = formatPrice(vals[1], precision);
                        if (vals[2] !== undefined) updateEntry.bidHigh = formatPrice(vals[2], precision);
                        if (vals[3] !== undefined) updateEntry.bidLow = formatPrice(vals[3], precision);

                        if (vals[4] !== undefined) {
                            const changeVal = parseFloat(vals[4]);
                            updateEntry.direction = changeVal >= 0 ? 'up' : 'down';
                            updateEntry.change = (changeVal > 0 ? '+' : '') + changeVal.toFixed(2) + '%';
                        }

                        updatesBufferRef.current[symbol] = updateEntry;
                    };

                    // Format 1: Snapshot/batch — { type: "snapshot", data: { "XAUUSD": [...], "EURUSD": [...] } }
                    if (parsed && parsed.data && typeof parsed.data === 'object') {
                        Object.entries(parsed.data).forEach(([symbol, vals]) => {
                            processSymbolUpdate(symbol, vals);
                        });
                    }

                    // Format 2: Individual tick update — { s: "XAUUSD", p: [bid, ask, high, low, change] }
                    if (parsed && parsed.s && parsed.p) {
                        processSymbolUpdate(parsed.s, parsed.p);
                    }
                } catch (err) {
                    // Silently ignore malformed frames (heartbeats, etc.)
                }
            };

            ws.onerror = (e) => {
                console.error('[MarketSidebar] WS error:', e);
            };

            ws.onclose = (closeEvent) => {
                console.log('[MarketSidebar] WS disconnected', closeEvent?.code, closeEvent?.reason);
                wsRef.current = null;
                if (isUnmountedRef.current) return;

                // ── Token-expired detection on WebSocket close ──
                if (isTokenExpiredWsEvent(closeEvent)) {
                    handleTokenRefreshAndReconnect();
                } else {
                    // General reconnection logic with backoff
                    console.log(`[MarketSidebar] Scheduling reconnect in ${reconnectDelay}ms...`);
                    reconnectTimer = setTimeout(() => {
                        reconnectDelay = Math.min(reconnectDelay * 2, 30000); // Backoff up to 30s
                        connectWs();
                    }, reconnectDelay);
                }
            };
        }

        /**
         * Refresh the trading token and reconnect the WebSocket.
         * Only attempts once per disconnect to prevent infinite loops.
         */
        async function handleTokenRefreshAndReconnect() {
            if (isUnmountedRef.current || refreshAttemptedRef.current) return;
            refreshAttemptedRef.current = true;

            console.log('[MarketSidebar] Attempting token refresh before reconnect...');
            const newToken = await refreshTradingToken();

            if (newToken && !isUnmountedRef.current) {
                console.log('[MarketSidebar] Token refreshed — reconnecting WebSocket...');
                // Dispatch event so other components (datafeed, etc.) know tokens changed
                window.dispatchEvent(new CustomEvent('tradingTokenRefreshed', { detail: { accessToken: newToken } }));
                connectWs();
            } else {
                console.error('[MarketSidebar] Token refresh failed — cannot reconnect');
            }
        }

        // Listen for token updates from other parts of the app
        const handleGlobalTokenRefresh = (e) => {
            console.log('[MarketSidebar] Global token refresh detected — reconnecting...');
            refreshAttemptedRef.current = false;
            if (wsRef.current) {
                wsRef.current.close(); // This will trigger onclose -> connectWs
            } else {
                connectWs();
            }
        };
        window.addEventListener('tradingTokenRefreshed', handleGlobalTokenRefresh);

        connectWs();

        // Flush buffered updates to React state at ~10 FPS
        const renderInterval = setInterval(() => {
            const pending = updatesBufferRef.current;
            const keys = Object.keys(pending);
            if (keys.length === 0) return;

            // Merge into the persistent Map for O(1) future lookups
            keys.forEach(sym => {
                marketDataMapRef.current.set(sym, {
                    ...(marketDataMapRef.current.get(sym) || {}),
                    ...pending[sym]
                });
            });

            // Convert Map to array and force a new reference for React
            setMarketData(Array.from(marketDataMapRef.current.values()));
            updatesBufferRef.current = {};
        }, 100);

        return () => {
            isUnmountedRef.current = true;
            clearInterval(renderInterval);
            clearTimeout(reconnectTimer);
            window.removeEventListener('tradingTokenRefreshed', handleGlobalTokenRefresh);
            if (wsRef.current) {
                const ws = wsRef.current;
                wsRef.current = null;
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
            }
        };
    }, []);

    const toggleStar = (e, symbol) => {
        e.stopPropagation(); // Prevent opening modal when clicking star
        setMarketData(prevData =>
            prevData.map(item =>
                item.symbol === symbol ? { ...item, starred: !item.starred } : item
            )
        );
    };

    const filteredData = marketData.filter(item => {
        const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeCategory === '★') {
            return matchesSearch && item.starred;
        }

        // Instrument Type Filtering Logic
        // Mapping: forex=Currencies, commodity=Commodities, index=Indices, crypto=Crypto
        const symbolInfo = config?.symbols?.find(s => s.symbol === item.symbol);
        const type = (symbolInfo?.instrumentType || item.instrumentType || '').toLowerCase();

        if (activeCategory === 'Currencies' && type !== 'forex') return false;
        if (activeCategory === 'Commodities' && type !== 'commodity') return false;
        if (activeCategory === 'Indices' && type !== 'index') return false;
        if (activeCategory === 'Crypto' && type !== 'crypto') return false;

        return matchesSearch;
    });

    return (
        <div className="market-sidebar">
            {modalData ? (
                <OrderPlacementModal
                    symbol={modalData.symbol}
                    bid={marketData.find(m => m.symbol === modalData.symbol)?.bid || modalData.bid}
                    ask={marketData.find(m => m.symbol === modalData.symbol)?.ask || modalData.ask}
                    tickDirection={marketData.find(m => m.symbol === modalData.symbol)?.tickDirection}
                    onClose={() => setModalData(null)}
                />
            ) : (
                <>
                    {/* Search Box Header */}
                    <div className="market-search-box-header">
                        <div className="market-search-box">
                            <Search size={14} className="market-search-icon" />
                            <input
                                type="text"
                                placeholder="Search Symbols"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="market-search-input"
                            />
                        </div>
                        <button className="market-sidebar-toggle-btn" onClick={onToggleSidebar} title="Close Sidebar">
                            <PanelLeftClose size={16} />
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className="market-categories">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`market-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Column Headers */}
                    <div className="market-list-header">
                        <span className="market-col-symbol">Symbol</span>
                        <span className="market-col-bid">Bid</span>
                        <span className="market-col-ask">Ask</span>
                    </div>

                    {/* Market List */}
                    <div className="market-list">
                        {filteredData.map((item) => (
                            <div
                                key={item.symbol}
                                className={`market-item ${selectedSymbol === item.symbol ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedSymbol(item.symbol);
                                    setModalData(item);
                                }}
                            >
                                <div className="market-item-left">
                                    <div
                                        className="market-star-wrapper"
                                        onClick={(e) => toggleStar(e, item.symbol)}
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <Star
                                            size={12}
                                            className={`market-star ${item.starred ? 'starred' : ''}`}
                                            fill={item.starred ? '#f59e0b' : 'none'}
                                            color={item.starred ? '#f59e0b' : 'var(--text-muted)'}
                                        />
                                    </div>
                                    <span className="market-symbol-name">{item.symbol}</span>
                                    <span className={`market-arrow ${item.tickDirection === 'down' ? 'arrow-down' : 'arrow-up'}`}>
                                        {item.tickDirection === 'down' ? '▼' : '▲'}
                                    </span>
                                    <span className={`market-change ${item.tickDirection === 'down' ? 'negative' : 'positive'}`}>
                                        {item.change}
                                    </span>
                                </div>
                                <div className="market-price-col">
                                    <span className={`market-bid-price ${item.tickDirection === 'up' ? 'price-up' : item.tickDirection === 'down' ? 'price-down' : ''}`}>
                                        {item.bid}
                                    </span>
                                    <span className="market-price-range-val">L: {item.bidLow}</span>
                                </div>
                                <div className="market-price-col">
                                    <span className={`market-ask-price ${item.tickDirection === 'up' ? 'price-up' : item.tickDirection === 'down' ? 'price-down' : ''}`}>
                                        {item.ask}
                                    </span>
                                    <span className="market-price-range-val">H: {item.bidHigh}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
