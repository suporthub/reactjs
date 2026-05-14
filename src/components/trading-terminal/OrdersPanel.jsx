import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, Pencil, Download } from 'lucide-react';
import { ordersManager } from '../../utils/ordersCache';
import { ordersWebSocket } from '../../utils/ordersWebSocket';
import { tradingFetch } from '../../utils/tradingTokenManager';

const TABS = ['Open Positions', 'Pending Orders', 'Rejected Orders', 'History'];

// API config for history & rejected orders

const HISTORY_API_URL = 'https://v3.livefxhub.com:8444/api/orders/history';
const HISTORY_PAGE_LIMIT = 50;

export default React.memo(function OrdersPanel({ isMinimized, onToggleMinimize }) {
    const [activeTab, setActiveTab] = useState('Open Positions');
    const [utcTime, setUtcTime] = useState('');
    const [openPositions, setOpenPositions] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);
    const [symbolConfigs, setSymbolConfigs] = useState({});
    const [livePrices, setLivePrices] = useState({});
    const [editOrderPopup, setEditOrderPopup] = useState({ isOpen: false, orderId: null, type: '', price: '', precision: 5 });
    const [cancelOrderConfirm, setCancelOrderConfirm] = useState({ isOpen: false, ticketId: null });
    const [cancelExitConfirm, setCancelExitConfirm] = useState({ isOpen: false, ticketId: null, type: null });
    const [orderMessage, setOrderMessage] = useState(null);

    // ── History tab state ──────────────────────────────────────
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyCursor, setHistoryCursor] = useState(null);
    const [historyHasMore, setHistoryHasMore] = useState(true);
    const [historyInitialLoaded, setHistoryInitialLoaded] = useState(false);
    const [historyFilters, setHistoryFilters] = useState({
        search: '',
        fromDate: '',
        toDate: ''
    });

    // ── Rejected Orders tab state ──────────────────────────────
    const [rejectedData, setRejectedData] = useState([]);
    const [rejectedLoading, setRejectedLoading] = useState(false);
    const [rejectedCursor, setRejectedCursor] = useState(null);
    const [rejectedHasMore, setRejectedHasMore] = useState(true);
    const [rejectedInitialLoaded, setRejectedInitialLoaded] = useState(false);
    const [rejectedFilters, setRejectedFilters] = useState({
        search: '',
        fromDate: '',
        toDate: ''
    });

    const tableScrollRef = useRef(null);
    const mountedRef = useRef(true);
    const historyFetchingRef = useRef(false);
    const rejectedFetchingRef = useRef(false);

    // ── Clock ──────────────────────────────────────────────────
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' });
            setUtcTime(timeStr + ' UTC');
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    // ── Initial fetch and setup ──────────────────────────────────
    useEffect(() => {
        mountedRef.current = true;

        (async () => {
            try {
                // 1. Fetch initial snapshot
                const [orders, config] = await Promise.all([
                    ordersManager.getOrders(true),
                    import('../../utils/tradingConfigCache').then(m => m.tradingConfigManager.getConfig())
                ]);

                if (mountedRef.current) {
                    setOpenPositions(orders.open_positions || []);
                    setPendingOrders(orders.pending_orders || []);

                    if (config?.symbols) {
                        const configMap = {};
                        config.symbols.forEach(s => { configMap[s.symbol] = s; });
                        setSymbolConfigs(configMap);
                    }

                    setIsLoading(false);
                    ordersWebSocket.connect();
                }
            } catch (err) {
                console.error('[OrdersPanel] Init failed:', err);
                if (mountedRef.current) setIsLoading(false);
            }
        })();

        return () => {
            mountedRef.current = false;
            ordersWebSocket.disconnect();
        };
    }, []);

    // ── Live updates via custom events ───────────────────────────
    useEffect(() => {
        const onOrdersUpdate = (e) => {
            if (mountedRef.current && e.detail) {
                setOpenPositions(e.detail.open_positions || []);
                setPendingOrders(e.detail.pending_orders || []);
            }
        };

        const onPriceUpdate = (e) => {
            if (mountedRef.current && e.detail) {
                const { symbol, vals } = e.detail;
                setLivePrices(prev => ({
                    ...prev,
                    [symbol]: { bid: vals[0], ask: vals[1] }
                }));
            }
        };

        const handleOrderResult = (e) => {
            if (mountedRef.current && e.detail) {
                const data = e.detail;
                
                // If this is a bulk result (like Close All), show it prominently
                if (data.isBulk) {
                    setOrderMessage({
                        type: data.success ? 'success' : 'error',
                        text: data.message
                    });
                    
                    // Mark bulk as active for 2 seconds to prevent individual closes from overriding
                    window._lastBulkTime = Date.now();
                    
                    setTimeout(() => {
                        if (mountedRef.current) setOrderMessage(null);
                    }, 5000);
                    return;
                }

                // For individual results, check if we just showed a bulk result
                if (window._lastBulkTime && (Date.now() - window._lastBulkTime < 2000)) {
                    // Ignore individual results for 2 seconds after a bulk action
                    return;
                }

                let messageText = data.message || (data.success ? 'Order processed' : 'Order failed');
                
                // If we have a ticket_id, append it for better clarity
                const ticketId = data.ticket_id || data.ticketId || data.orderId || data.order_id || data.ticket || data.id;
                
                if (data.success && ticketId) {
                    messageText = `${messageText} (Ticket: ${ticketId})`;
                }

                setOrderMessage({
                    type: data.success ? 'success' : 'error',
                    text: messageText
                });
                
                // Clear message after 4 seconds
                setTimeout(() => {
                    if (mountedRef.current) setOrderMessage(null);
                }, 4000);
            }
        };

        window.addEventListener('ordersUpdated', onOrdersUpdate);
        window.addEventListener('marketPriceUpdate', onPriceUpdate);
        window.addEventListener('orderResult', handleOrderResult);
        return () => {
            window.removeEventListener('ordersUpdated', onOrdersUpdate);
            window.removeEventListener('marketPriceUpdate', onPriceUpdate);
            window.removeEventListener('orderResult', handleOrderResult);
        };
    }, []);

    // ── History API fetch ────────────────────────────────────────
    const fetchHistory = useCallback(async (cursor = null, isLoadMore = false) => {
        // Prevent duplicate fetches
        if (historyFetchingRef.current) return;
        historyFetchingRef.current = true;

        if (!isLoadMore) {
            setHistoryLoading(true);
        }

        try {
            let url = `${HISTORY_API_URL}?type=completed&limit=${HISTORY_PAGE_LIMIT}`;
            
            // Intelligent Search Logic
            if (historyFilters.search) {
                const s = historyFilters.search.trim();
                // If it's numeric or long or contains '-', assume Order ID
                if (/^\d+$/.test(s) || s.length > 10 || s.includes('-')) {
                    url += `&order_id=${s}`;
                } else {
                    url += `&symbol=${s.toUpperCase()}`;
                }
            }
            
            if (historyFilters.fromDate) url += `&from_date=${historyFilters.fromDate}`;
            if (historyFilters.toDate) url += `&to_date=${historyFilters.toDate}`;
            
            if (cursor) {
                url += `&cursor=${cursor}`;
            }

            const response = await tradingFetch(url, { method: 'GET' });

            if (!response.ok) {
                console.error('[OrdersPanel] History fetch failed:', response.status);
                return;
            }

            const result = await response.json();
            const newOrders = result.data || [];
            const nextCursor = result.next_cursor || null;

            if (mountedRef.current) {
                if (isLoadMore) {
                    setHistoryData(prev => [...prev, ...newOrders]);
                } else {
                    setHistoryData(newOrders);
                }
                setHistoryCursor(nextCursor);
                setHistoryHasMore(nextCursor !== null && newOrders.length >= HISTORY_PAGE_LIMIT);
                setHistoryInitialLoaded(true);
            }
        } catch (err) {
            console.error('[OrdersPanel] History fetch error:', err);
        } finally {
            if (mountedRef.current) {
                setHistoryLoading(false);
            }
            historyFetchingRef.current = false;
        }
    }, [historyFilters]);

    // ── Rejected Orders API fetch ────────────────────────────────
    const fetchRejected = useCallback(async (cursor = null, isLoadMore = false) => {
        if (rejectedFetchingRef.current) return;
        rejectedFetchingRef.current = true;

        if (!isLoadMore) {
            setRejectedLoading(true);
        }

        try {
            let url = `${HISTORY_API_URL}?type=rejected&limit=${HISTORY_PAGE_LIMIT}`;
            
            // Intelligent Search Logic
            if (rejectedFilters.search) {
                const s = rejectedFilters.search.trim();
                if (/^\d+$/.test(s) || s.length > 10 || s.includes('-')) {
                    url += `&order_id=${s}`;
                } else {
                    url += `&symbol=${s.toUpperCase()}`;
                }
            }
            
            if (rejectedFilters.fromDate) url += `&from_date=${rejectedFilters.fromDate}`;
            if (rejectedFilters.toDate) url += `&to_date=${rejectedFilters.toDate}`;
            
            if (cursor) {
                url += `&cursor=${cursor}`;
            }

            const response = await tradingFetch(url, { method: 'GET' });

            if (!response.ok) {
                console.error('[OrdersPanel] Rejected fetch failed:', response.status);
                return;
            }

            const result = await response.json();
            const newOrders = result.data || [];
            const nextCursor = result.next_cursor || null;

            if (mountedRef.current) {
                if (isLoadMore) {
                    setRejectedData(prev => [...prev, ...newOrders]);
                } else {
                    setRejectedData(newOrders);
                }
                setRejectedCursor(nextCursor);
                setRejectedHasMore(nextCursor !== null && newOrders.length >= HISTORY_PAGE_LIMIT);
                setRejectedInitialLoaded(true);
            }
        } catch (err) {
            console.error('[OrdersPanel] Rejected fetch error:', err);
        } finally {
            if (mountedRef.current) {
                setRejectedLoading(false);
            }
            rejectedFetchingRef.current = false;
        }
    }, [rejectedFilters]);

    const handleDownloadCSV = useCallback(async () => {
        try {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = '2024-01-01';
            const url = `https://v3.livefxhub.com:8444/api/orders/export/csv?start_date=${startDate}&end_date=${endDate}`;

            setOrderMessage({ type: 'success', text: 'Preparing statement download...' });

            const response = await tradingFetch(url, { method: 'GET' });
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait a minute.');
                }
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `trading_statement_${startDate}_to_${endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            setOrderMessage({ type: 'success', text: 'Statement downloaded' });
        } catch (err) {
            console.error('[OrdersPanel] Download error:', err);
            setOrderMessage({ type: 'error', text: err.message || 'Failed to download statement' });
        }
    }, []);

    // ── Fetch data when tab is selected ──────────────────────────
    useEffect(() => {
        // We handle initial fetch in the onClick and handleTableScroll, 
        // but if the component ever mounts with these tabs active, we fetch here.
        if (activeTab === 'History' && !historyInitialLoaded) {
            fetchHistory();
        }
        if (activeTab === 'Rejected Orders' && !rejectedInitialLoaded) {
            fetchRejected();
        }
    }, [activeTab, historyInitialLoaded, rejectedInitialLoaded, fetchHistory, fetchRejected]);

    // ── Infinite scroll handler for both History & Rejected ─────
    const handleTableScroll = useCallback((e) => {
        const el = e.target;
        if (el.scrollHeight - el.scrollTop - el.clientHeight >= 40) return;

        if (activeTab === 'History') {
            if (!historyHasMore || historyLoading || historyFetchingRef.current) return;
            const lastItem = historyData[historyData.length - 1];
            if (lastItem) fetchHistory(lastItem.id, true);
        } else if (activeTab === 'Rejected Orders') {
            if (!rejectedHasMore || rejectedLoading || rejectedFetchingRef.current) return;
            const lastItem = rejectedData[rejectedData.length - 1];
            if (lastItem) fetchRejected(lastItem.id, true);
        }
    }, [activeTab, historyHasMore, historyLoading, historyData, fetchHistory, rejectedHasMore, rejectedLoading, rejectedData, fetchRejected]);

    // ── Format helpers ──────────────────────────────────────────
    const formatTime = useCallback((time) => {
        if (!time) return '—';
        try {
            return new Date(time).toISOString().replace('T', ' ').slice(0, 23).replace(' ', 'T') + 'Z';
        } catch { return '—'; }
    }, []);

    const safeFixed = useCallback((val, digits = 2) => {
        const num = parseFloat(val);
        return isNaN(num) ? '—' : num.toFixed(digits);
    }, []);

    const getUSDConversionRate = useCallback((symbolName) => {
        if (!symbolName) return 1;
        const config = symbolConfigs[symbolName];
        if (!config) return 1;

        // Extract currency from instrumentType or symbol name
        // For Forex (type 1), quote currency is usually the last 3 chars
        const type = (config.instrumentType || '').toString().toLowerCase();
        let quoteCurrency = 'USD';

        if (type === '1' || type === 'forex') {
            const base = symbolName.split('.')[0].replace('+', '');
            if (base.length >= 6) quoteCurrency = base.substring(3, 6);
        } else if (type === '3' || type === 'indices' || type === 'index') {
            const base = symbolName.split('.')[0].replace('+', '');
            if (base.includes('JPN225')) quoteCurrency = 'JPY';
            else if (base.includes('GER40') || base.includes('ESP35') || base.includes('FRA40')) quoteCurrency = 'EUR';
            else if (base.includes('UK100')) quoteCurrency = 'GBP';
            else if (base.includes('AUS200')) quoteCurrency = 'AUD';
            else if (base.includes('HK50')) quoteCurrency = 'HKD';
        }

        if (quoteCurrency === 'USD') return 1;

        // Try to find conversion rate from live prices
        // Direct pair: e.g. GBPUSD
        const directPair = `${quoteCurrency}USD`;
        if (livePrices[directPair]?.bid) return parseFloat(livePrices[directPair].bid);

        // Indirect pair: e.g. USDJPY
        const indirectPair = `USD${quoteCurrency}`;
        if (livePrices[indirectPair]?.bid) return 1 / parseFloat(livePrices[indirectPair].bid);

        return 1; // Fallback
    }, [symbolConfigs, livePrices]);

    const renderHeader = () => {
        switch (activeTab) {
            case 'Open Positions':
                return (
                    <tr>
                        <th>Order ID</th>
                        <th>Symbol Name</th>
                        <th>Order Time</th>
                        <th>Order Type</th>
                        <th>Quantity</th>
                        <th>Open Price</th>
                        <th>Market Price</th>
                        <th>Commission</th>
                        <th>Swap</th>
                        <th>Stop Loss</th>
                        <th>Take Profit</th>
                        <th>Profit/Loss</th>
                        <th
                            style={{ textAlign: 'center', cursor: 'pointer' }}
                            onClick={() => setShowCloseAllConfirm(true)}
                            title="Close All Open Positions"
                        >
                            Close All <span className="close-all-x" style={{ color: '#DA5244', marginLeft: '4px' }}>×</span>
                        </th>
                    </tr>
                );
            case 'Pending Orders':
                return (
                    <tr>
                        <th>Order ID</th>
                        <th>Symbol Name</th>
                        <th>Order Time</th>
                        <th>Order Type</th>
                        <th>Quantity</th>
                        <th>Open Price</th>
                        <th>Market Price</th>
                        <th>Stop Loss</th>
                        <th>Take Profit</th>
                        <th style={{ textAlign: 'center' }}>Edit</th>
                    </tr>
                );
            case 'Rejected Orders':
                return (
                    <tr>
                        <th>Order ID</th>
                        <th>Symbol Name</th>
                        <th>Rejected Time</th>
                        <th>Order Type</th>
                        <th>Quantity</th>
                        <th>Rejected Price</th>
                        <th>Stop Loss</th>
                        <th>Take Profit</th>
                        <th>Reason</th>
                    </tr>
                );
            case 'History':
                return (
                    <tr>
                        <th>Order ID</th>
                        <th>Symbol Name</th>
                        <th>Open Time</th>
                        <th>Close Time</th>
                        <th>Order Type</th>
                        <th>Quantity</th>
                        <th>Open Price</th>
                        <th>Close Price</th>
                        <th>Stop Loss</th>
                        <th>Take Profit</th>
                        <th>Commission</th>
                        <th>Swap</th>
                        <th>Net Profit</th>
                        <th>Close Message</th>
                    </tr>
                );
            default:
                return null;
        }
    };

    const renderRows = () => {
        switch (activeTab) {
            case 'Open Positions':
                if (isLoading) return <tr><td colSpan={13} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>Loading orders...</td></tr>;
                if (openPositions.length === 0) return <tr><td colSpan={13} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No open positions</td></tr>;

                const sortedOpenPositions = [...openPositions].sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));

                return sortedOpenPositions.map((order) => {
                    const config = symbolConfigs[order.symbolName];
                    const precision = config?.showPoints ?? 5;
                    const contractSize = config?.contractSize ?? 1;
                    const live = livePrices[order.symbolName];

                    // Logic: BUY orders close at BID, SELL orders close at ASK
                    const isBuy = order.orderType.toUpperCase().includes('BUY');
                    const displayMarketPrice = live
                        ? (isBuy ? live.bid : live.ask)
                        : order.marketPrice;

                    // Calculate P/L: (Current - Open) * Volume * ContractSize for BUY
                    //                (Open - Current) * Volume * ContractSize for SELL
                    const priceDiff = isBuy
                        ? (displayMarketPrice - order.openPrice)
                        : (order.openPrice - displayMarketPrice);

                    const conversionRate = getUSDConversionRate(order.symbolName);
                    const floatingPL = (priceDiff * order.quantity * contractSize) * conversionRate;
                    const finalPL = floatingPL - order.commission + order.swap;

                    return (
                        <tr key={order.orderId}>
                            <td className="order-id-cell">{order.orderId}</td>
                            <td className="order-symbol-cell">{order.symbolName}</td>
                            <td className="order-time-cell">{formatTime(order.orderTime)}</td>
                            <td>
                                <span className={`order-type-badge ${isBuy ? 'buy' : 'sell'}`}>
                                    {order.orderType}
                                </span>
                            </td>
                            <td>{safeFixed(order.quantity, 2)}</td>
                            <td>{safeFixed(order.openPrice, precision)}</td>
                            <td>{safeFixed(displayMarketPrice, precision)}</td>
                            <td>{safeFixed(order.commission, 2)}</td>
                            <td className={order.swap >= 0 ? 'positive' : 'negative'}>{safeFixed(order.swap, 2)}</td>
                            <td className="order-action-cell">
                                {order.stopLoss > 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                        {safeFixed(order.stopLoss, precision)}
                                        <X
                                            size={12}
                                            style={{ color: '#DA5244', cursor: 'pointer' }}
                                            onClick={() => setCancelExitConfirm({ isOpen: true, ticketId: order.orderId, type: 'SL' })}
                                        />
                                    </div>
                                ) : (
                                    <span className="order-add-link" onClick={() => setEditOrderPopup({ isOpen: true, orderId: order.orderId, type: 'SL', price: safeFixed(order.openPrice, precision), precision })}>Add SL +</span>
                                )}
                            </td>
                            <td className="order-action-cell">
                                {order.takeProfit > 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                        {safeFixed(order.takeProfit, precision)}
                                        <X
                                            size={12}
                                            style={{ color: '#DA5244', cursor: 'pointer' }}
                                            onClick={() => setCancelExitConfirm({ isOpen: true, ticketId: order.orderId, type: 'TP' })}
                                        />
                                    </div>
                                ) : (
                                    <span className="order-add-link" onClick={() => setEditOrderPopup({ isOpen: true, orderId: order.orderId, type: 'TP', price: safeFixed(order.openPrice, precision), precision })}>Add TP +</span>
                                )}
                            </td>
                            <td className={`order-pl-cell ${finalPL >= 0 ? 'positive' : 'negative'}`}>
                                {safeFixed(finalPL, 2)}
                            </td>
                            <td className="order-close-cell" style={{ textAlign: 'center' }}>
                                <X
                                    size={14}
                                    className="order-close-btn"
                                    onClick={() => ordersWebSocket.closeOrder(order.orderId)}
                                />
                            </td>
                        </tr>
                    );
                });
            case 'Pending Orders':
                if (isLoading) return <tr><td colSpan={10} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>Loading orders...</td></tr>;
                if (pendingOrders.length === 0) return <tr><td colSpan={10} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No pending orders</td></tr>;

                const sortedPendingOrders = [...pendingOrders].sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));

                return sortedPendingOrders.map((order) => {
                    const precision = symbolConfigs[order.symbolName]?.showPoints ?? 5;
                    const live = livePrices[order.symbolName];
                    const isBuy = order.orderType.toUpperCase().includes('BUY');
                    const displayMarketPrice = live
                        ? live.ask
                        : order.marketPrice;

                    return (
                        <tr key={order.orderId}>
                            <td className="order-id-cell">{order.orderId}</td>
                            <td className="order-symbol-cell">{order.symbolName}</td>
                            <td className="order-time-cell">{formatTime(order.orderTime)}</td>
                            <td>
                                <span className={`order-type-badge ${isBuy ? 'buy' : 'sell'}`}>
                                    {order.orderType}
                                </span>
                            </td>
                            <td>{safeFixed(order.quantity, 2)}</td>
                            <td>{safeFixed(order.openPrice, precision)}</td>
                            <td>{safeFixed(displayMarketPrice, precision)}</td>
                            <td>{order.stopLoss > 0 ? safeFixed(order.stopLoss, precision) : '0.00000'}</td>
                            <td>{order.takeProfit > 0 ? safeFixed(order.takeProfit, precision) : '0.00000'}</td>
                            <td style={{ textAlign: 'center' }}>
                                <Pencil
                                    size={14}
                                    style={{ color: '#3687ED', cursor: 'pointer' }}
                                    onClick={() => setCancelOrderConfirm({ isOpen: true, ticketId: order.orderId })}
                                />
                            </td>
                        </tr>
                    );
                });
            case 'Rejected Orders':
                if (rejectedLoading && rejectedData.length === 0) return <tr><td colSpan={9} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>Loading rejected orders...</td></tr>;
                if (!rejectedLoading && rejectedData.length === 0) return <tr><td colSpan={9} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No rejected orders</td></tr>;
                return (
                    <>
                        {rejectedData.map((order) => {
                            const precision = symbolConfigs[order.symbol]?.showPoints ?? 5;
                            return (
                                <tr key={order.id}>
                                    <td className="order-id-cell">{order.orderId}</td>
                                    <td className="order-symbol-cell">{order.symbol}</td>
                                    <td className="order-time-cell">{formatTime(order.updatedAt)}</td>
                                    <td>
                                        <span className={`order-type-badge ${order.orderType.toLowerCase().includes('buy') ? 'buy' : 'sell'}`}>
                                            {order.orderType}
                                        </span>
                                    </td>
                                    <td>{safeFixed(order.volume, 2)}</td>
                                    <td>{safeFixed(order.openPrice, precision)}</td>
                                    <td>{safeFixed(order.stopLoss || order.sl || 0, precision)}</td>
                                    <td>{safeFixed(order.takeProfit || order.tp || 0, precision)}</td>
                                    <td style={{ color: '#DA5244', textTransform: 'capitalize' }}>{order.closeReason || '—'}</td>
                                </tr>
                            );
                        })}
                        {rejectedLoading && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)' }}>Loading more...</td></tr>
                        )}
                    </>
                );
            case 'History':
                if (historyLoading && historyData.length === 0) return <tr><td colSpan={14} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>Loading history...</td></tr>;
                if (!historyLoading && historyData.length === 0) return <tr><td colSpan={14} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No history</td></tr>;
                return (
                    <>
                        {historyData.map((order) => {
                            const precision = symbolConfigs[order.symbol]?.showPoints ?? 5;
                            const totalCommission = parseFloat(order.openCommission || 0) + parseFloat(order.closeCommission || 0);
                            const netPnl = parseFloat(order.netPnl || 0);
                            return (
                                <tr key={order.id}>
                                    <td className="order-id-cell">{order.orderId}</td>
                                    <td className="order-symbol-cell">{order.symbol}</td>
                                    <td className="order-time-cell">{formatTime(order.openedAt)}</td>
                                    <td className="order-time-cell">{formatTime(order.closedAt)}</td>
                                    <td>
                                        <span className={`order-type-badge ${order.orderType.toLowerCase().includes('buy') ? 'buy' : 'sell'}`}>
                                            {order.orderType}
                                        </span>
                                    </td>
                                    <td>{safeFixed(order.volume, 2)}</td>
                                    <td>{safeFixed(order.openPrice, precision)}</td>
                                    <td>{safeFixed(order.closePrice, precision)}</td>
                                    <td>{safeFixed(order.stopLoss || order.sl || 0, precision)}</td>
                                    <td>{safeFixed(order.takeProfit || order.tp || 0, precision)}</td>
                                    <td>{safeFixed(totalCommission, 2)}</td>
                                    <td>{safeFixed(order.swap, 2)}</td>
                                    <td style={{ color: netPnl >= 0 ? '#3687ED' : '#DA5244', fontWeight: '600' }}>{safeFixed(netPnl, 2)}</td>
                                    <td style={{ color: '#DA5244', textTransform: 'capitalize' }}>{order.closeReason || '—'}</td>
                                </tr>
                            );
                        })}
                        {historyLoading && (
                            <tr><td colSpan={14} style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)' }}>Loading more...</td></tr>
                        )}
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`orders-panel ${isMinimized ? 'minimized' : ''}`} style={{ height: '100%', flex: 1 }}>
            {/* Order Tabs */}
            <div className="orders-tabs">
                <div className="orders-tabs-left">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            className={`orders-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(tab);
                                // Fetch data on every click for History as requested
                                if (tab === 'History') {
                                    fetchHistory();
                                }
                                if (tab === 'Rejected Orders') {
                                    fetchRejected();
                                }
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="orders-tabs-right" style={{ display: 'flex', alignItems: 'center' }}>
                    {/* Inline Filters for History/Rejected */}
                    {(activeTab === 'History' || activeTab === 'Rejected Orders') && (
                        <div className="header-inline-filters" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            marginRight: '4px',
                            borderRight: '1px solid var(--border-color)',
                            paddingRight: '8px'
                        }}>
                            {/* Combined Search Input */}
                            <input 
                                type="text" 
                                placeholder="Search Symbol / ID..."
                                value={activeTab === 'History' ? historyFilters.search : rejectedFilters.search}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (activeTab === 'History') setHistoryFilters(prev => ({ ...prev, search: val }));
                                    else setRejectedFilters(prev => ({ ...prev, search: val }));
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && (activeTab === 'History' ? fetchHistory() : fetchRejected())}
                                style={{
                                    backgroundColor: 'var(--surface)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '3px',
                                    color: 'var(--text-main)',
                                    fontSize: '9px',
                                    padding: '2px 8px',
                                    width: '160px',
                                    outline: 'none',
                                    height: '22px',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                            />

                            {/* Adaptive Date Range Group */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '2px', 
                                background: 'var(--surface)', 
                                borderRadius: '3px', 
                                padding: '0 4px', 
                                marginLeft: '2px',
                                border: '1px solid var(--border-color)',
                                height: '22px'
                            }}>
                                <input 
                                    type="date" 
                                    value={activeTab === 'History' ? historyFilters.fromDate : rejectedFilters.fromDate}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (activeTab === 'History') setHistoryFilters(prev => ({ ...prev, fromDate: val }));
                                        else setRejectedFilters(prev => ({ ...prev, fromDate: val }));
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-main)',
                                        fontSize: '9px',
                                        padding: 0,
                                        width: '82px',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        colorScheme: 'inherit'
                                    }}
                                />
                                <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 'bold' }}>-</span>
                                <input 
                                    type="date" 
                                    value={activeTab === 'History' ? historyFilters.toDate : rejectedFilters.toDate}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (activeTab === 'History') setHistoryFilters(prev => ({ ...prev, toDate: val }));
                                        else setRejectedFilters(prev => ({ ...prev, toDate: val }));
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-main)',
                                        fontSize: '9px',
                                        padding: 0,
                                        width: '82px',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        colorScheme: 'inherit'
                                    }}
                                />
                            </div>

                            {/* GO Button (beside calendar) */}
                            <button 
                                onClick={() => activeTab === 'History' ? fetchHistory() : fetchRejected()}
                                style={{
                                    backgroundColor: 'var(--primary)',
                                    border: 'none',
                                    borderRadius: '2px',
                                    color: '#FFFFFF',
                                    fontSize: '9px',
                                    padding: '0 10px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    height: '22px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                GO
                            </button>

                            {/* Clear Button */}
                            <button 
                                onClick={() => {
                                    const reset = { search: '', fromDate: '', toDate: '' };
                                    if (activeTab === 'History') { setHistoryFilters(reset); setTimeout(() => fetchHistory(), 0); }
                                    else { setRejectedFilters(reset); setTimeout(() => fetchRejected(), 0); }
                                }}
                                style={{
                                    backgroundColor: 'rgba(218, 82, 68, 0.05)',
                                    border: '1px solid rgba(218, 82, 68, 0.2)',
                                    borderRadius: '3px',
                                    color: '#DA5244',
                                    fontSize: '9px',
                                    padding: '0 6px',
                                    cursor: 'pointer',
                                    marginLeft: '2px',
                                    height: '22px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Clear Filters"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <button
                        className="orders-download-btn"
                        onClick={handleDownloadCSV}
                        title="Download Statement (CSV)"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0 12px',
                            display: 'flex',
                            alignItems: 'center',
                            height: '100%',
                            transition: 'color 0.2s',
                            borderLeft: '1px solid var(--border-color)',
                            outline: 'none'
                        }}
                    >
                        <Download size={13} style={{ marginRight: '6px' }} />
                        <span style={{ fontSize: '11px', fontWeight: '600' }}>Statement</span>
                    </button>
                    <div className="orders-panel-clock" style={{
                        padding: '0 12px',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: '600',
                        borderLeft: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%'
                    }}>
                        {utcTime}
                    </div>
                    <button
                        className="orders-panel-toggle-btn"
                        onClick={onToggleMinimize}
                        title={isMinimized ? "Expand Panel" : "Minimize Panel"}
                    >
                        {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {/* Order Message Notification */}
            {orderMessage && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 2000,
                    padding: '8px 16px',
                    borderRadius: '4px',
                    backgroundColor: orderMessage.type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(218, 82, 68, 0.9)',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    pointerEvents: 'none',
                    fontFamily: 'Arial, sans-serif'
                }}>
                    {orderMessage.text}
                </div>
            )}

            {/* Orders Table - hidden when minimized */}
            {!isMinimized && (
                <div
                    className="orders-table-wrapper"
                    ref={tableScrollRef}
                    onScroll={(activeTab === 'History' || activeTab === 'Rejected Orders') ? handleTableScroll : undefined}
                >
                    <table className="orders-table" style={(activeTab === 'History' || activeTab === 'Rejected Orders') ? { fontSize: '8px' } : {}}>
                        <thead>
                            {renderHeader()}
                        </thead>
                        <tbody>
                            {renderRows()}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Close All Confirmation Modal */}
            {showCloseAllConfirm && (
                <div className="orders-confirm-overlay" style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div className="orders-confirm-modal" style={{
                        backgroundColor: '#111625',
                        border: '1px solid #1A2138',
                        borderRadius: '6px',
                        padding: '16px 24px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                        textAlign: 'center',
                        minWidth: '260px',
                        fontFamily: 'Arial, sans-serif'
                    }}>
                        <p style={{ margin: '0 0 16px 0', fontSize: '10px', color: '#FFFFFF', fontWeight: 'normal' }}>
                            Are you sure you want to close all open positions?
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => {
                                    ordersWebSocket.closeAllOrders();
                                    setShowCloseAllConfirm(false);
                                }}
                                style={{
                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    border: '1px solid #4CAF50',
                                    color: '#4CAF50',
                                    padding: '4px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'normal',
                                    fontSize: '10px',
                                    fontFamily: 'Arial, sans-serif',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(76, 175, 80, 0.2)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(76, 175, 80, 0.1)'}
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setShowCloseAllConfirm(false)}
                                style={{
                                    backgroundColor: 'rgba(218, 82, 68, 0.1)',
                                    border: '1px solid #DA5244',
                                    color: '#DA5244',
                                    padding: '4px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'normal',
                                    fontSize: '10px',
                                    fontFamily: 'Arial, sans-serif',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(218, 82, 68, 0.2)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(218, 82, 68, 0.1)'}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SL/TP Edit Modal */}
            {editOrderPopup.isOpen && (() => {
                const activeOrder = [...openPositions, ...pendingOrders].find(o => o.orderId === editOrderPopup.orderId);
                let validationError = null;

                if (activeOrder && editOrderPopup.price) {
                    const val = parseFloat(editOrderPopup.price);
                    const isBuy = (activeOrder.orderType || '').toUpperCase().includes('BUY');
                    const live = livePrices[activeOrder.symbolName];

                    // Logic: BUY orders close at BID, SELL orders close at ASK
                    // We validate against the price the order would close at
                    const currentPrice = live
                        ? (isBuy ? live.bid : live.ask)
                        : (activeOrder.marketPrice || 0);

                    if (editOrderPopup.type === 'SL') {
                        if (isBuy && val >= currentPrice) {
                            validationError = `SL must be less than ${safeFixed(currentPrice, editOrderPopup.precision)}`;
                        } else if (!isBuy && val <= currentPrice && val !== 0) {
                            validationError = `SL must be more than ${safeFixed(currentPrice, editOrderPopup.precision)}`;
                        }
                    } else if (editOrderPopup.type === 'TP') {
                        if (isBuy && val <= currentPrice && val !== 0) {
                            validationError = `TP must be more than ${safeFixed(currentPrice, editOrderPopup.precision)}`;
                        } else if (!isBuy && val >= currentPrice) {
                            validationError = `TP must be less than ${safeFixed(currentPrice, editOrderPopup.precision)}`;
                        }
                    }
                }

                return (
                    <div className="orders-edit-overlay" style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 999
                    }}>
                        <div className="orders-edit-modal" style={{
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            minWidth: '300px',
                            fontFamily: 'Arial, sans-serif',
                            position: 'relative'
                        }}>
                            <button
                                onClick={() => setEditOrderPopup({ ...editOrderPopup, isOpen: false })}
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={16} />
                            </button>

                            <h3 style={{
                                margin: '0 0 16px 0',
                                fontSize: '14px',
                                color: 'var(--text-main)',
                                fontWeight: 'bold'
                            }}>
                                {editOrderPopup.type === 'SL' ? 'Stop Loss' : 'Take Profit'}
                            </h3>

                            <div style={{ marginBottom: validationError ? '12px' : '24px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    color: 'var(--text-muted)',
                                    marginBottom: '8px'
                                }}>
                                    price
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={editOrderPopup.price}
                                    onChange={(e) => setEditOrderPopup({ ...editOrderPopup, price: e.target.value })}
                                    style={{
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: `1px solid ${validationError ? '#DA5244' : 'var(--primary)'}`,
                                        backgroundColor: 'transparent',
                                        color: 'var(--text-main)',
                                        fontSize: '14px',
                                        fontFamily: 'Arial, sans-serif',
                                        outline: 'none'
                                    }}
                                />
                                {validationError && (
                                    <div style={{
                                        color: '#DA5244',
                                        fontSize: '10px',
                                        marginTop: '6px',
                                        fontWeight: '500'
                                    }}>
                                        {validationError}
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={!!validationError || !editOrderPopup.price}
                                onClick={() => {
                                    const orderId = editOrderPopup.orderId;
                                    const val = parseFloat(editOrderPopup.price) || 0;

                                    const allOrders = [...openPositions, ...pendingOrders];
                                    const order = allOrders.find(o => o.orderId === orderId);

                                    if (order) {
                                        const payload = {
                                            ticket_id: orderId,
                                            new_sl: editOrderPopup.type === 'SL' ? val : (order.stopLoss || 0),
                                            new_tp: editOrderPopup.type === 'TP' ? val : (order.takeProfit || 0)
                                        };
                                        ordersWebSocket.modifyOrder(payload);
                                    }

                                    setEditOrderPopup({ ...editOrderPopup, isOpen: false });
                                }}
                                style={{
                                    width: '100%',
                                    backgroundColor: validationError || !editOrderPopup.price ? 'var(--border-color)' : 'var(--primary)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '12px',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    cursor: validationError || !editOrderPopup.price ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: validationError || !editOrderPopup.price ? 0.6 : 1
                                }}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* Cancel Order Confirmation Modal */}
            {cancelOrderConfirm.isOpen && (
                <div className="orders-confirm-overlay" style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div className="orders-confirm-modal" style={{
                        backgroundColor: '#111625',
                        border: '1px solid #1A2138',
                        borderRadius: '6px',
                        padding: '16px 24px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                        textAlign: 'center',
                        minWidth: '260px',
                        fontFamily: 'Arial, sans-serif'
                    }}>
                        <p style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#FFFFFF', fontWeight: 'normal' }}>
                            Are you sure you want to cancel this order?
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => {
                                    ordersWebSocket.cancelOrder(cancelOrderConfirm.ticketId);
                                    setCancelOrderConfirm({ isOpen: false, ticketId: null });
                                }}
                                style={{
                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    border: '1px solid #4CAF50',
                                    color: '#4CAF50',
                                    padding: '4px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'normal',
                                    fontSize: '11px',
                                    fontFamily: 'Arial, sans-serif',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(76, 175, 80, 0.2)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(76, 175, 80, 0.1)'}
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setCancelOrderConfirm({ isOpen: false, ticketId: null })}
                                style={{
                                    backgroundColor: 'rgba(218, 82, 68, 0.1)',
                                    border: '1px solid #DA5244',
                                    color: '#DA5244',
                                    padding: '4px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'normal',
                                    fontSize: '11px',
                                    fontFamily: 'Arial, sans-serif',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(218, 82, 68, 0.2)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(218, 82, 68, 0.1)'}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel SL/TP Confirmation Modal */}
            {cancelExitConfirm.isOpen && (
                <div className="orders-confirm-overlay" style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div className="orders-confirm-modal" style={{
                        backgroundColor: '#111625',
                        border: '1px solid #1A2138',
                        borderRadius: '6px',
                        padding: '16px 24px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                        textAlign: 'center',
                        minWidth: '260px',
                        fontFamily: 'Arial, sans-serif'
                    }}>
                        <p style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#FFFFFF', fontWeight: 'normal' }}>
                            Are you sure you want to cancel this {cancelExitConfirm.type === 'SL' ? 'Stop Loss' : 'Take Profit'}?
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => {
                                    const allOrders = [...openPositions, ...pendingOrders];
                                    const order = allOrders.find(o => o.orderId === cancelExitConfirm.ticketId);
                                    if (order) {
                                        const payload = {
                                            ticket_id: cancelExitConfirm.ticketId,
                                            new_sl: cancelExitConfirm.type === 'SL' ? 0 : (order.stopLoss || 0),
                                            new_tp: cancelExitConfirm.type === 'TP' ? 0 : (order.takeProfit || 0)
                                        };
                                        ordersWebSocket.modifyOrder(payload);
                                    }
                                    setCancelExitConfirm({ isOpen: false, ticketId: null, type: null });
                                }}
                                style={{
                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    border: '1px solid #4CAF50',
                                    color: '#4CAF50',
                                    padding: '4px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'normal',
                                    fontSize: '11px',
                                    fontFamily: 'Arial, sans-serif'
                                }}
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setCancelExitConfirm({ isOpen: false, ticketId: null, type: null })}
                                style={{
                                    backgroundColor: 'rgba(218, 82, 68, 0.1)',
                                    border: '1px solid #DA5244',
                                    color: '#DA5244',
                                    padding: '4px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'normal',
                                    fontSize: '11px',
                                    fontFamily: 'Arial, sans-serif'
                                }}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
