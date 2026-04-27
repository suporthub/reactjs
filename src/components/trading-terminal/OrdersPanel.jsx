import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Pencil } from 'lucide-react';

const TABS = ['Open Positions', 'Pending Orders', 'Rejected Orders', 'History'];

const OPEN_POSITIONS_DATA = [
    {
        orderId: '8990041241000',
        symbolName: 'AUDCAD',
        orderTime: '2026-02-28T07:11:48.002Z',
        orderType: 'BUY',
        quantity: 2.00,
        openPrice: 0.97378,
        marketPrice: 0.95127,
        commission: 20.00,
        swap: -4.87,
        stopLoss: null,
        takeProfit: null,
        profitLoss: -3342.17,
    },
    {
        orderId: '9056158141000',
        symbolName: 'AUDCNH',
        orderTime: '2026-02-26T07:23:01.002Z',
        orderType: 'BUY',
        quantity: 0.01,
        openPrice: 4.87280,
        marketPrice: 4.85730,
        commission: 0.10,
        swap: 0.01,
        stopLoss: null,
        takeProfit: null,
        profitLoss: 2.36,
    }
];

const PENDING_ORDERS_DATA = [
    {
        orderId: '6539352602000',
        symbolName: 'AUDCAD',
        orderTime: '2026-01-23T10:49:53.000Z',
        orderType: 'SELL LIMIT',
        quantity: 0.01,
        openPrice: 1.00000,
        marketPrice: 0.96639
    }
];

const REJECTED_ORDERS_DATA = [
    {
        orderId: '3424813917000',
        symbolName: 'XAUUSD',
        rejectedTime: '2026-03-09T05:30:48.000Z',
        orderType: 'BUY',
        quantity: 0.01,
        rejectedPrice: 5099.24,
        reason: 'insufficient_margin'
    },
    {
        orderId: '3420777217000',
        symbolName: 'XAUUSD',
        rejectedTime: '2026-03-09T05:30:07.000Z',
        orderType: 'SELL',
        quantity: 0.01,
        rejectedPrice: 5095.93,
        reason: 'insufficient_margin'
    }
];

const HISTORY_DATA = [
    {
        orderId: '3322766417000',
        symbolName: 'XAUUSD',
        openTime: '2026-03-10T09:00:27.000Z',
        closeTime: '2026-03-10T09:00:32.000Z',
        orderType: 'BUY',
        quantity: 0.01,
        openPrice: 5183.38,
        closePrice: 5181.38,
        commission: 0.10,
        swap: 0.00,
        netProfit: -2.10,
        closeMessage: 'Closed'
    }
];

export default React.memo(function OrdersPanel({ isMinimized, onToggleMinimize }) {
    const [activeTab, setActiveTab] = useState('Open Positions');
    const [utcTime, setUtcTime] = useState('');

    // ── Clock ──────────────────────────────────────────────────
    React.useEffect(() => {
        const tick = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' });
            setUtcTime(timeStr + ' UTC');
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

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
                        <th style={{ textAlign: 'center' }}>Close All <span className="close-all-x">×</span></th>
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
        const formatTime = (time) => new Date(time).toISOString().replace('T', ' ').slice(0, 23).replace(' ', 'T') + 'Z';

        switch (activeTab) {
            case 'Open Positions':
                return OPEN_POSITIONS_DATA.map((order) => (
                    <tr key={order.orderId}>
                        <td className="order-id-cell">{order.orderId}</td>
                        <td className="order-symbol-cell">{order.symbolName}</td>
                        <td className="order-time-cell">{formatTime(order.orderTime)}</td>
                        <td>
                            <span className={`order-type-badge ${order.orderType.toLowerCase().includes('buy') ? 'buy' : 'sell'}`}>
                                {order.orderType}
                            </span>
                        </td>
                        <td>{order.quantity.toFixed(2)}</td>
                        <td>{order.openPrice.toFixed(5)}</td>
                        <td>{order.marketPrice.toFixed(5)}</td>
                        <td>{order.commission.toFixed(2)}</td>
                        <td className={order.swap >= 0 ? 'positive' : 'negative'}>{order.swap.toFixed(2)}</td>
                        <td className="order-action-cell"><span className="order-add-link">Add SL +</span></td>
                        <td className="order-action-cell"><span className="order-add-link">Add TP +</span></td>
                        <td className={`order-pl-cell ${order.profitLoss >= 0 ? 'positive' : 'negative'}`}>{order.profitLoss.toFixed(2)}</td>
                        <td className="order-close-cell" style={{ textAlign: 'center' }}><X size={14} className="order-close-btn" /></td>
                    </tr>
                ));
            case 'Pending Orders':
                return PENDING_ORDERS_DATA.map((order) => (
                    <tr key={order.orderId}>
                        <td className="order-id-cell">{order.orderId}</td>
                        <td className="order-symbol-cell">{order.symbolName}</td>
                        <td className="order-time-cell">{formatTime(order.orderTime)}</td>
                        <td>
                            <span className={`order-type-badge ${order.orderType.toLowerCase().includes('buy') ? 'buy' : 'sell'}`}>
                                {order.orderType}
                            </span>
                        </td>
                        <td>{order.quantity.toFixed(2)}</td>
                        <td>{order.openPrice.toFixed(5)}</td>
                        <td>{order.marketPrice.toFixed(5)}</td>
                        <td style={{ textAlign: 'center' }}>
                            <Pencil size={14} style={{ color: '#3687ED', cursor: 'pointer' }} />
                        </td>
                    </tr>
                ));
            case 'Rejected Orders':
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
                        <td>{order.quantity.toFixed(2)}</td>
                        <td>{order.rejectedPrice.toFixed(2)}</td>
                        <td style={{ color: '#DA5244' }}>{order.reason}</td>
                    </tr>
                ));
            case 'History':
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
                        <td>{order.quantity.toFixed(2)}</td>
                        <td>{order.openPrice.toFixed(2)}</td>
                        <td>{order.closePrice.toFixed(2)}</td>
                        <td>{order.commission.toFixed(2)}</td>
                        <td>{order.swap.toFixed(2)}</td>
                        <td className={order.netProfit >= 0 ? 'positive' : 'negative'}>{order.netProfit.toFixed(2)}</td>
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
        </div>
    );
});
