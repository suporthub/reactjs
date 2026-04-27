import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { decode } from '@msgpack/msgpack';
import { Search, Star, PanelLeftClose } from 'lucide-react';
import OrderPlacementModal from './OrderPlacementModal';
import {
    getTradingAccessToken,
    refreshTradingToken,
    isTokenExpiredWsEvent,
    isTokenExpiredWsMessage
} from '../../utils/tradingTokenManager';
import { tradingConfigManager } from '../../utils/tradingConfigCache';

const CATEGORIES = ['★', 'Currencies', 'Commodities', 'Indices', 'Crypto'];

const formatPrice = (val, precision) => {
    if (val === undefined || val === null || val === '-') return val || '-';
    const num = Number(val);
    if (isNaN(num)) return val;
    if (precision !== undefined) return num.toFixed(precision);
    return Number(num.toPrecision(6)).toString();
};

const renderPrice = (price, className) => {
    if (!price || price === '-' || typeof price !== 'string') return <span className={className}>{price}</span>;
    const main = price.slice(0, -1);
    const pipette = price.slice(-1);
    return (
        <span className={className}>
            {main}<span className="price-pipette">{pipette}</span>
        </span>
    );
};

// ── Memoized Market Item ─────────────────────────────────────
// CRITICAL: Props must be primitive or stable references to avoid
// breaking React.memo. The `onToggleStar` callback is passed as
// a separate stable prop, NOT spread into the item object.
const MarketItem = React.memo(({
    symbol, bid, ask, tickDirection, starred, change,
    bidHigh, bidLow, instrumentType,
    isSelected, onSelect, onToggleStar, tradingMode
}) => {
    return (
        <div
            className={`market-item ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(symbol)}
        >
            <div className="market-item-left">
                <div
                    className="market-star-wrapper"
                    onClick={(e) => { e.stopPropagation(); onToggleStar(symbol); }}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                    <Star
                        size={12}
                        className={`market-star ${starred ? 'starred' : ''}`}
                        fill={starred ? '#f59e0b' : 'none'}
                        color={starred ? '#f59e0b' : 'var(--text-muted)'}
                    />
                </div>
                <span className="market-symbol-name">{symbol}</span>
                <span className={`market-arrow ${tickDirection === 'down' ? 'arrow-down' : 'arrow-up'}`}>
                    {tickDirection === 'down' ? '▼' : '▲'}
                </span>
                {tradingMode === 'Advanced' && (
                    <span className={`market-change ${tickDirection === 'down' ? 'negative' : 'positive'}`}>
                        {change}
                    </span>
                )}
            </div>
            <div className="market-price-col">
                {renderPrice(bid, `market-bid-price ${tickDirection === 'up' ? 'price-up' : tickDirection === 'down' ? 'price-down' : ''}`)}
                {tradingMode === 'Advanced' && (
                    <span className="market-price-range-val">L: {renderPrice(bidLow)}</span>
                )}
            </div>
            <div className="market-price-col">
                {renderPrice(ask, `market-ask-price ${tickDirection === 'up' ? 'price-up' : tickDirection === 'down' ? 'price-down' : ''}`)}
                {tradingMode === 'Advanced' && (
                    <span className="market-price-range-val">H: {renderPrice(bidHigh)}</span>
                )}
            </div>
        </div>
    );
});

export default function MarketSidebar({ selectedSymbol, setSelectedSymbol, onToggleSidebar }) {
    // ── State ──
    const [marketData, setMarketData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Currencies');
    const [modalData, setModalData] = useState(null);
    const [tradingMode, setTradingMode] = useState('Normal');

    // ── Refs (never trigger re-renders) ──
    const wsRef = useRef(null);
    const masterMapRef = useRef(new Map());     // symbol → data object (source of truth)
    const prevPricesRef = useRef({});            // symbol → last bid number
    const isUnmountedRef = useRef(false);
    const refreshAttemptedRef = useRef(false);
    const configRef = useRef(null);
    const pendingCountRef = useRef(0);           // count of pending updates since last flush
    const rafIdRef = useRef(null);               // requestAnimationFrame ID

    // ── Load Config ──
    useEffect(() => {
        const load = async () => {
            const data = await tradingConfigManager.getConfig();
            if (data?.symbols) {
                configRef.current = data;
                const map = new Map();
                data.symbols.forEach(s => {
                    const item = {
                        symbol: s.symbol, bid: '-', ask: '-',
                        instrumentType: s.instrumentType, starred: false
                    };

                    // Proactive Snapshot Injection:
                    // If the config response contains a price snapshot, apply it immediately
                    // so the user sees data without waiting for the WebSocket handshake.
                    const snapshot = (data.snapshot && data.snapshot[s.symbol]) || (data.prices && data.prices[s.symbol]);
                    if (snapshot && Array.isArray(snapshot)) {
                        const precision = s.showPoints;
                        if (snapshot[0] !== undefined) {
                            item.bid = formatPrice(snapshot[0], precision);
                            prevPricesRef.current[s.symbol] = parseFloat(snapshot[0]);
                        }
                        if (snapshot[1] !== undefined) item.ask = formatPrice(snapshot[1], precision);
                        if (snapshot[2] !== undefined) item.bidHigh = formatPrice(snapshot[2], precision);
                        if (snapshot[3] !== undefined) item.bidLow = formatPrice(snapshot[3], precision);
                        if (snapshot[4] !== undefined) {
                            const v = parseFloat(snapshot[4]);
                            item.change = (v > 0 ? '+' : '') + v.toFixed(2) + '%';
                        }
                        // Default tick direction for snapshot
                        item.tickDirection = 'up'; 
                    }

                    map.set(s.symbol, item);
                });
                masterMapRef.current = map;
                setMarketData(Array.from(map.values()));
            }
        };
        load();
        const handler = (e) => { if (e.detail) configRef.current = e.detail; };
        window.addEventListener('tradingConfigUpdated', handler);
        return () => window.removeEventListener('tradingConfigUpdated', handler);
    }, []);

    useEffect(() => {
        const handler = (e) => { if (e.detail?.mode) setTradingMode(e.detail.mode); };
        window.addEventListener('tradingModeChanged', handler);
        return () => window.removeEventListener('tradingModeChanged', handler);
    }, []);

    // ── WebSocket Connection ──
    useEffect(() => {
        isUnmountedRef.current = false;
        let reconnectTimer = null;
        let reconnectDelay = 1000;
        let lastDataTimestamp = Date.now();
        let intentionalClose = false;

        // === FLUSH MECHANISM ===
        // Uses requestAnimationFrame to sync with browser paint cycle.
        // This is far more efficient than setInterval because:
        // 1. It automatically pauses when the tab is hidden
        // 2. It runs at the optimal time for the browser to repaint
        // 3. It never blocks the main thread
        function scheduleFlush() {
            if (rafIdRef.current) return; // already scheduled
            rafIdRef.current = requestAnimationFrame(() => {
                rafIdRef.current = null;
                if (pendingCountRef.current === 0) return;
                pendingCountRef.current = 0;
                setMarketData(Array.from(masterMapRef.current.values()));
            });
        }

        function processSymbolUpdate(symbol, vals) {
            if (!symbol || !Array.isArray(vals)) return;
            lastDataTimestamp = Date.now();

            const existing = masterMapRef.current.get(symbol);
            if (!existing) return; // Not in our config, ignore

            const symbolInfo = configRef.current?.symbols?.find(s => s.symbol === symbol);
            const precision = symbolInfo?.showPoints;

            if (vals[0] !== undefined) {
                const newBid = parseFloat(vals[0]);
                const prevBid = prevPricesRef.current[symbol];
                if (prevBid !== undefined) {
                    existing.tickDirection = newBid > prevBid ? 'up' : newBid < prevBid ? 'down' : existing.tickDirection;
                }
                prevPricesRef.current[symbol] = newBid;
                existing.bid = formatPrice(vals[0], precision);
            }
            if (vals[1] !== undefined) existing.ask = formatPrice(vals[1], precision);
            if (vals[2] !== undefined) existing.bidHigh = formatPrice(vals[2], precision);
            if (vals[3] !== undefined) existing.bidLow = formatPrice(vals[3], precision);
            if (vals[4] !== undefined) {
                const v = parseFloat(vals[4]);
                existing.change = (v > 0 ? '+' : '') + v.toFixed(2) + '%';
            }

            pendingCountRef.current++;
            scheduleFlush();

            // Broadcast price update for other components (e.g. TradingView Datafeed)
            window.dispatchEvent(new CustomEvent('marketPriceUpdate', {
                detail: { symbol, vals }
            }));
        }

        function cleanupWs() {
            if (wsRef.current) {
                const ws = wsRef.current;
                wsRef.current = null;
                ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
            }
        }

        function connectWs() {
            if (isUnmountedRef.current) return;
            cleanupWs();
            intentionalClose = false;

            const token = getTradingAccessToken();
            if (!token) {
                reconnectTimer = setTimeout(connectWs, 2000);
                return;
            }

            const ws = new WebSocket(`wss://v3.livefxhub.com:8444/?token=${token}`);
            ws.binaryType = 'arraybuffer';
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log('[MarketSidebar] WS connected');
                refreshAttemptedRef.current = false;
                reconnectDelay = 1000;
                lastDataTimestamp = Date.now();

                const cfg = configRef.current || await tradingConfigManager.getConfig();
                const symbols = cfg?.symbols?.map(s => s.symbol) || [];
                if (symbols.length > 0 && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ action: 'subscribe', symbols }));
                }
            };

            ws.onmessage = (event) => {
                try {
                    let parsed;
                    if (typeof event.data === 'string') {
                        if (event.data === 'ping') {
                            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'pong' }));
                            return;
                        }
                        parsed = JSON.parse(event.data);
                    } else if (event.data instanceof ArrayBuffer) {
                        if (event.data.byteLength === 0) return;
                        parsed = decode(new Uint8Array(event.data));
                    } else return;

                    // Handle pings
                    if (parsed?.type === 'ping' || parsed?.action === 'ping') {
                        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'pong' }));
                        return;
                    }

                    // Handle connection confirmation (ignore silently)
                    if (parsed?.type === 'connected') return;

                    // Handle token expiry
                    if (isTokenExpiredWsMessage(parsed)) {
                        intentionalClose = true;
                        ws.close();
                        handleTokenRefreshAndReconnect();
                        return;
                    }

                    // Batched prices: { type: 'prices', data: { SYMBOL: [bid,ask,h,l,chg] } }
                    if (parsed?.data && typeof parsed.data === 'object') {
                        const entries = Object.entries(parsed.data);
                        for (let i = 0; i < entries.length; i++) {
                            processSymbolUpdate(entries[i][0], entries[i][1]);
                        }
                    }

                    // Legacy single tick: { s: 'SYMBOL', p: [...] }
                    if (parsed?.s && parsed?.p) {
                        processSymbolUpdate(parsed.s, parsed.p);
                    }
                } catch (err) {
                    console.error('[MarketSidebar] Parse error:', err);
                }
            };

            ws.onerror = () => {}; // onclose handles reconnection

            ws.onclose = (e) => {
                wsRef.current = null;
                if (isUnmountedRef.current || intentionalClose) return;

                if (isTokenExpiredWsEvent(e)) {
                    handleTokenRefreshAndReconnect();
                } else {
                    reconnectTimer = setTimeout(() => {
                        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
                        connectWs();
                    }, reconnectDelay);
                }
            };
        }

        async function handleTokenRefreshAndReconnect() {
            if (isUnmountedRef.current || refreshAttemptedRef.current) return;
            refreshAttemptedRef.current = true;
            const newToken = await refreshTradingToken();
            if (newToken && !isUnmountedRef.current) {
                window.dispatchEvent(new CustomEvent('tradingTokenRefreshed', { detail: { accessToken: newToken } }));
                connectWs();
            } else {
                reconnectTimer = setTimeout(() => {
                    refreshAttemptedRef.current = false;
                    connectWs();
                }, 5000);
            }
        }

        // Token refresh from other components (e.g. TradingTerminal timer)
        const onTokenRefresh = () => {
            refreshAttemptedRef.current = false;
            intentionalClose = true;
            cleanupWs();
            setTimeout(connectWs, 100);
        };
        window.addEventListener('tradingTokenRefreshed', onTokenRefresh);

        // Stale data watchdog — reconnect if no data for 35s
        const checkStaleData = () => {
            if (isUnmountedRef.current) return;
            if (Date.now() - lastDataTimestamp > 35000) {
                console.warn('[MarketSidebar] Stale data — reconnecting');
                intentionalClose = true;
                cleanupWs();
                connectWs();
            }
        };
        const watchdog = setInterval(checkStaleData, 5000);

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkStaleData();
                // Force a flush in case there are pending updates that were paused
                if (pendingCountRef.current > 0) scheduleFlush();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        // Start connection
        setTimeout(connectWs, 50);

        return () => {
            isUnmountedRef.current = true;
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
            clearInterval(watchdog);
            clearTimeout(reconnectTimer);
            window.removeEventListener('tradingTokenRefreshed', onTokenRefresh);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            cleanupWs();
        };
    }, []);

    // ── Stable callbacks (never change identity) ──
    const toggleStar = useCallback((symbol) => {
        const existing = masterMapRef.current.get(symbol);
        if (existing) {
            existing.starred = !existing.starred;
            setMarketData(Array.from(masterMapRef.current.values()));
        }
    }, []);

    const onSelectItem = useCallback((symbol) => {
        setSelectedSymbol(symbol);
        const item = masterMapRef.current.get(symbol);
        if (item) setModalData(item);
    }, [setSelectedSymbol]);

    // ── Filtering (memoized) ──
    const filteredData = useMemo(() => {
        return marketData
            .filter(item => {
                const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase());
                if (activeCategory === '★') return matchesSearch && item.starred;
                const type = (item.instrumentType || '').toLowerCase();
                if (activeCategory === 'Currencies' && type !== 'forex') return false;
                if (activeCategory === 'Commodities' && type !== 'commodity') return false;
                if (activeCategory === 'Indices' && type !== 'index') return false;
                if (activeCategory === 'Crypto' && type !== 'crypto') return false;
                return matchesSearch;
            })
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    }, [marketData, searchTerm, activeCategory]);

    return (
        <div className="market-sidebar">
            {modalData ? (
                <OrderPlacementModal
                    symbol={modalData.symbol}
                    bid={masterMapRef.current.get(modalData.symbol)?.bid || modalData.bid}
                    ask={masterMapRef.current.get(modalData.symbol)?.ask || modalData.ask}
                    tickDirection={masterMapRef.current.get(modalData.symbol)?.tickDirection}
                    allMarketData={marketData}
                    onClose={() => setModalData(null)}
                />
            ) : (
                <>
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

                    <div className="market-list-header">
                        <span className="market-col-symbol">Symbol</span>
                        <span className="market-col-bid">Bid</span>
                        <span className="market-col-ask">Ask</span>
                    </div>

                    <div className="market-list">
                        {filteredData.length > 0 ? (
                            filteredData.map(item => (
                                <MarketItem
                                    key={item.symbol}
                                    symbol={item.symbol}
                                    bid={item.bid}
                                    ask={item.ask}
                                    tickDirection={item.tickDirection}
                                    starred={item.starred}
                                    change={item.change}
                                    bidHigh={item.bidHigh}
                                    bidLow={item.bidLow}
                                    instrumentType={item.instrumentType}
                                    isSelected={selectedSymbol === item.symbol}
                                    onSelect={onSelectItem}
                                    onToggleStar={toggleStar}
                                    tradingMode={tradingMode}
                                />
                            ))
                        ) : (
                            <div className="market-no-results">
                                {marketData.length === 0 ? 'Loading prices...' : 'No results found'}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
