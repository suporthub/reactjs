import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Helper for institutional price display (small last digit / pipette)
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

// ── Memoized Market Item Component ──────────────────────────
const MarketItem = React.memo(({ item, selectedSymbol, setSelectedSymbol, setModalData, tradingMode }) => {
    return (
        <div
            className={`market-item ${selectedSymbol === item.symbol ? 'selected' : ''}`}
            onClick={() => {
                setSelectedSymbol(item.symbol);
                setModalData(item);
            }}
        >
            <div className="market-item-left">
                <div
                    className="market-star-wrapper"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Star logic moved to parent via a dedicated toggle function
                        item.onToggleStar(item.symbol);
                    }}
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
                {tradingMode === 'Advanced' && (
                    <span className={`market-change ${item.tickDirection === 'down' ? 'negative' : 'positive'}`}>
                        {item.change}
                    </span>
                )}
            </div>
            <div className="market-price-col">
                {renderPrice(item.bid, `market-bid-price ${item.tickDirection === 'up' ? 'price-up' : item.tickDirection === 'down' ? 'price-down' : ''}`)}
                {tradingMode === 'Advanced' && (
                    <span className="market-price-range-val">
                        L: {renderPrice(item.bidLow)}
                    </span>
                )}
            </div>
            <div className="market-price-col">
                {renderPrice(item.ask, `market-ask-price ${item.tickDirection === 'up' ? 'price-up' : item.tickDirection === 'down' ? 'price-down' : ''}`)}
                {tradingMode === 'Advanced' && (
                    <span className="market-price-range-val">
                        H: {renderPrice(item.bidHigh)}
                    </span>
                )}
            </div>
        </div>
    );
}, (prev, next) => {
    // Only re-render if essential properties changed
    return (
        prev.item.bid === next.item.bid &&
        prev.item.ask === next.item.ask &&
        prev.item.tickDirection === next.item.tickDirection &&
        prev.item.starred === next.item.starred &&
        prev.item.change === next.item.change &&
        prev.selectedSymbol === next.selectedSymbol &&
        prev.tradingMode === next.tradingMode
    );
});

export default function MarketSidebar({ selectedSymbol, setSelectedSymbol, onToggleSidebar }) {
    const [marketData, setMarketData] = useState(MARKET_DATA);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Currencies');
    const [modalData, setModalData] = useState(null);
    const [config, setConfig] = useState(null);
    const wsRef = useRef(null);
    const updatesBufferRef = useRef(new Map());
    const marketDataMapRef = useRef(new Map()); // O(1) lookups by symbol
    const prevPricesRef = useRef({}); // Track previous bid prices for tick direction
    const isUnmountedRef = useRef(false);
    const refreshAttemptedRef = useRef(false);
    const configRef = useRef(null);
    const [tradingMode, setTradingMode] = useState('Normal');

    // ── Load Config (metadata only) ──
    useEffect(() => {
        const loadConfig = async () => {
            const data = await tradingConfigManager.getConfig();
            if (data && data.symbols) {
                setConfig(data);
                configRef.current = data;
                
                // Initialize map with config symbols immediately
                const initialMap = new Map();
                data.symbols.forEach(s => {
                    initialMap.set(s.symbol, { 
                        symbol: s.symbol, 
                        bid: '-', ask: '-', 
                        instrumentType: s.instrumentType,
                        starred: false 
                    });
                });
                marketDataMapRef.current = initialMap;
                setMarketData(Array.from(initialMap.values()));
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

    // ── Listen for Trading Mode Changes ──
    useEffect(() => {
        const handleModeChange = (e) => {
            if (e.detail?.mode) setTradingMode(e.detail.mode);
        };
        window.addEventListener('tradingModeChanged', handleModeChange);
        return () => window.removeEventListener('tradingModeChanged', handleModeChange);
    }, []);

    useEffect(() => {
        isUnmountedRef.current = false;
        let reconnectTimer = null;
        let reconnectDelay = 1000;
        let heartbeatInterval = null;
        let lastDataTimestamp = Date.now();
        let staleWatchdogInterval = null;
        let intentionalClose = false;

        const handleTokenRefresh = () => {
            console.log('[MarketSidebar] Token refreshed, reconnecting WebSocket...');
            connectWs();
        };
        window.addEventListener('tradingTokenRefreshed', handleTokenRefresh);

        function cleanupWs() {
            if (wsRef.current) {
                const ws = wsRef.current;
                wsRef.current = null;
                ws.onopen = null;
                ws.onmessage = null;
                ws.onerror = null;
                ws.onclose = null;
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

            console.log('[MarketSidebar] Connecting WebSocket...');
            const ws = new WebSocket(`wss://v3.livefxhub.com:8444/?token=${token}`);
            ws.binaryType = "arraybuffer";
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log('[MarketSidebar] Connected to LiveFXHub Market Data WS');
                refreshAttemptedRef.current = false;
                reconnectDelay = 1000;
                lastDataTimestamp = Date.now();

                const currentConfig = configRef.current || await tradingConfigManager.getConfig();
                const symbols = currentConfig?.symbols?.map(s => s.symbol) || [];
                if (symbols.length > 0 && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ action: "subscribe", symbols }));
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

                    if (parsed && (parsed.type === 'ping' || parsed.action === 'ping')) {
                        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'pong' }));
                        return;
                    }

                    if (isTokenExpiredWsMessage(parsed)) {
                        intentionalClose = true;
                        ws.close();
                        handleTokenRefreshAndReconnect();
                        return;
                    }

                    const processSymbolUpdate = (symbol, vals) => {
                        if (!symbol || !Array.isArray(vals)) return;
                        lastDataTimestamp = Date.now();

                        // Access map directly for extreme performance (no object copies here)
                        const existing = marketDataMapRef.current.get(symbol) || { symbol, starred: false };
                        const updateEntry = { ...existing };

                        const symbolInfo = configRef.current?.symbols?.find(s => s.symbol === symbol);
                        const precision = symbolInfo?.showPoints;
                        if (symbolInfo?.instrumentType) updateEntry.instrumentType = symbolInfo.instrumentType;

                        if (vals[0] !== undefined) {
                            const newBid = parseFloat(vals[0]);
                            const prevBid = prevPricesRef.current[symbol];
                            if (prevBid !== undefined) {
                                if (newBid > prevBid) updateEntry.tickDirection = 'up';
                                else if (newBid < prevBid) updateEntry.tickDirection = 'down';
                            }
                            prevPricesRef.current[symbol] = newBid;
                            updateEntry.bid = formatPrice(vals[0], precision);
                        }

                        if (vals[1] !== undefined) updateEntry.ask = formatPrice(vals[1], precision);
                        if (vals[2] !== undefined) updateEntry.bidHigh = formatPrice(vals[2], precision);
                        if (vals[3] !== undefined) updateEntry.bidLow = formatPrice(vals[3], precision);

                        if (vals[4] !== undefined) {
                            const changeVal = parseFloat(vals[4]);
                            updateEntry.change = (changeVal > 0 ? '+' : '') + changeVal.toFixed(2) + '%';
                        }

                        // Buffer the update for the next batch cycle
                        updatesBufferRef.current.set(symbol, updateEntry);
                    };

                    if (parsed && parsed.data && typeof parsed.data === 'object') {
                        Object.entries(parsed.data).forEach(([symbol, vals]) => processSymbolUpdate(symbol, vals));
                    }
                    if (parsed && parsed.s && parsed.p) {
                        processSymbolUpdate(parsed.s, parsed.p);
                    }
                } catch (err) {
                    console.error('[MarketSidebar] WS parsing error:', err);
                }
            };

            ws.onclose = (closeEvent) => {
                console.log('[MarketSidebar] WS disconnected', closeEvent?.code);
                wsRef.current = null;
                if (isUnmountedRef.current || intentionalClose) return;

                if (isTokenExpiredWsEvent(closeEvent)) {
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

        // Flush buffered updates to React state at 10 FPS (100ms)
        const renderInterval = setInterval(() => {
            const pending = updatesBufferRef.current;
            if (pending.size === 0) return;

            // Update the master map
            pending.forEach((update, symbol) => {
                marketDataMapRef.current.set(symbol, update);
            });

            // Trigger re-render with a NEW array reference
            // Because MarketItem is memoized, only the rows that actually had an update will re-draw.
            setMarketData(Array.from(marketDataMapRef.current.values()));
            
            // Clear buffer safely
            updatesBufferRef.current = new Map();
        }, 100);

        staleWatchdogInterval = setInterval(() => {
            if (isUnmountedRef.current) return;
            if (Date.now() - lastDataTimestamp > 60000) {
                console.warn('[MarketSidebar] Stale data — reconnecting');
                intentionalClose = true;
                cleanupWs();
                connectWs();
            }
        }, 15000);

        setTimeout(() => connectWs(), 50);

        return () => {
            isUnmountedRef.current = true;
            clearInterval(renderInterval);
            clearInterval(staleWatchdogInterval);
            clearTimeout(reconnectTimer);
            window.removeEventListener('tradingTokenRefreshed', handleTokenRefresh);
            cleanupWs();
        };
    }, []);

    const toggleStar = useCallback((symbol) => {
        setMarketData(prevData =>
            prevData.map(item =>
                item.symbol === symbol ? { ...item, starred: !item.starred } : item
            )
        );
        // Sync back to map so it survives the next render flush
        const existing = marketDataMapRef.current.get(symbol);
        if (existing) {
            marketDataMapRef.current.set(symbol, { ...existing, starred: !existing.starred });
        }
    }, []);

    const filteredData = React.useMemo(() => {
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
                    bid={marketDataMapRef.current.get(modalData.symbol)?.bid || modalData.bid}
                    ask={marketDataMapRef.current.get(modalData.symbol)?.ask || modalData.ask}
                    tickDirection={marketDataMapRef.current.get(modalData.symbol)?.tickDirection}
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
                        <button className="market-sidebar-toggle-btn" onClick={onToggleSidebar}>
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
                            filteredData.map((item) => (
                                <MarketItem
                                    key={item.symbol}
                                    item={{ ...item, onToggleStar: toggleStar }}
                                    selectedSymbol={selectedSymbol}
                                    setSelectedSymbol={setSelectedSymbol}
                                    setModalData={setModalData}
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
