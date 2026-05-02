import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { ordersManager } from '../../utils/ordersCache';
import { ordersWebSocket } from '../../utils/ordersWebSocket';

const TABS = ['Open Positions', 'Pending Orders', 'Rejected Orders', 'History'];

// Kept as local static data — these tabs are NOT part of the /orders/active API
const REJECTED_ORDERS_DATA = [];
const HISTORY_DATA = [];

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
    const mountedRef = useRef(true);

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
                setOrderMessage({
                    type: data.success ? 'success' : 'error',
                    text: data.message || (data.success ? 'Order processed' : 'Order failed')
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
                if (isLoading) return <tr><td colSpan={8} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>Loading orders...</td></tr>;
                if (pendingOrders.length === 0) return <tr><td colSpan={8} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No pending orders</td></tr>;
                
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
                if (REJECTED_ORDERS_DATA.length === 0) return <tr><td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No rejected orders</td></tr>;
                return REJECTED_ORDERS_DATA.map((order) => (
                    <tr key={order.orderId}>
                        <td className="order-id-cell">{order.orderId}</td>
                        <td className="order-symbol-cell">{order.symbolName}</td>
                        <td className="order-time-cell">{formatTime(order.rejectedTime)}</td>
                        <td>
                            <span className={`order-type-badge ${order.orderType.toLowerCase().includes('buy') ? 'buy' : 'sell'}`}>
                                {order.orderType}
                            </span>
                        </td>
                        <td>{safeFixed(order.quantity, 2)}</td>
                        <td>{safeFixed(order.rejectedPrice, 2)}</td>
                        <td style={{ color: '#DA5244' }}>{order.reason}</td>
                    </tr>
                ));
            case 'History':
                if (HISTORY_DATA.length === 0) return <tr><td colSpan={12} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No history</td></tr>;
                return HISTORY_DATA.map((order) => (
                    <tr key={order.orderId}>
                        <td className="order-id-cell">{order.orderId}</td>
                        <td className="order-symbol-cell">{order.symbolName}</td>
                        <td className="order-time-cell">{formatTime(order.openTime)}</td>
                        <td className="order-time-cell">{formatTime(order.closeTime)}</td>
                        <td>
                            <span className={`order-type-badge ${order.orderType.toLowerCase().includes('buy') ? 'buy' : 'sell'}`}>
                                {order.orderType}
                            </span>
                        </td>
                        <td>{safeFixed(order.quantity, 2)}</td>
                        <td>{safeFixed(order.openPrice, 2)}</td>
                        <td>{safeFixed(order.closePrice, 2)}</td>
                        <td>{safeFixed(order.commission, 2)}</td>
                        <td>{safeFixed(order.swap, 2)}</td>
                        <td className={order.netProfit >= 0 ? 'positive' : 'negative'}>{safeFixed(order.netProfit, 2)}</td>
                        <td>{order.closeMessage}</td>
                    </tr>
                ));
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
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="orders-tabs-right">
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
                <div className="orders-table-wrapper">
                    <table className="orders-table">
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
                    backgroundColor: 'rgba(10, 15, 28, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    backdropFilter: 'blur(2px)'
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
                                    console.log('Close All Confirmed');
                                    setShowCloseAllConfirm(false);
                                    // TODO: Dispatch API call to close all
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
            {editOrderPopup.isOpen && (
                <div className="orders-edit-overlay" style={{
                    position: 'fixed', // Use fixed to ensure it stays in viewport
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(10, 15, 28, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999, // Ensure it's above everything
                    backdropFilter: 'blur(2px)'
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
                        {/* Close button (X) in top right */}
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
                        
                        <div style={{ marginBottom: '24px' }}>
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
                                    border: '1px solid var(--primary)', // Blue border like image
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-main)',
                                    fontSize: '14px',
                                    fontFamily: 'Arial, sans-serif',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        
                        <button 
                            onClick={() => {
                                const orderId = editOrderPopup.orderId;
                                const val = parseFloat(editOrderPopup.price) || 0;
                                
                                // Find the existing order in either openPositions or pendingOrders
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
                                backgroundColor: 'var(--primary)', // Blue button
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '12px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}

            {/* Cancel Order Confirmation Modal */}
            {cancelOrderConfirm.isOpen && (
                <div className="orders-confirm-overlay" style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(10, 15, 28, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    backdropFilter: 'blur(2px)'
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
                    backgroundColor: 'rgba(10, 15, 28, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    backdropFilter: 'blur(2px)'
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
