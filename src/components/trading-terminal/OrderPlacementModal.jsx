import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import './trading-terminal.css';

export default function OrderPlacementModal({ symbol, bid, ask, tickDirection, onClose }) {
    const [lots, setLots] = useState('0.01');
    const [price, setPrice] = useState('');
    const [activeTab, setActiveTab] = useState('Instant');

    const validateNumberInput = (value) => {
        // Allow only numbers and a single decimal point
        const cleaned = value.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
        return cleaned;
    };

    const handleLotChange = (delta) => {
        setLots(prev => {
            const current = parseFloat(prev) || 0;
            const newValue = Math.max(0.01, current + delta);
            return newValue.toFixed(2);
        });
    };

    return (
        <div className="order-modal-content">
            <div className="order-modal-header" style={{ position: 'relative' }}>
                <h3 className="order-modal-title">{symbol}</h3>
                <button className="modal-close-btn" onClick={onClose}>
                    <X size={18} strokeWidth={3} />
                </button>
            </div>

            <div className="order-modal-tabs">
                {['Instant', 'Limit', 'Stop'].map(tab => (
                    <button 
                        key={tab} 
                        className={`order-modal-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="order-modal-prices">
                <div className="order-modal-price-box">
                    <span className="order-modal-price-label">Bid Price:</span>
                    <span className={`order-modal-price-val ${tickDirection === 'up' ? 'price-up' : tickDirection === 'down' ? 'price-down' : ''}`}>
                        {bid}
                    </span>
                </div>
                <div className="order-modal-price-box">
                    <span className="order-modal-price-label">Ask Price:</span>
                    <span className={`order-modal-price-val ${tickDirection === 'up' ? 'price-up' : tickDirection === 'down' ? 'price-down' : ''}`}>
                        {ask}
                    </span>
                </div>
            </div>

            {(activeTab === 'Limit' || activeTab === 'Stop') && (
                <div className="order-modal-limit-input">
                    <input 
                        type="text" 
                        className="order-modal-full-input" 
                        placeholder={`Current market price: ${ask}`} 
                        value={price}
                        onChange={(e) => setPrice(validateNumberInput(e.target.value))}
                    />
                </div>
            )}

            <div className="order-modal-inputs">
                <div className="order-modal-input-group">
                    <label>Lots</label>
                    <div className="order-modal-number-input">
                        <input 
                            type="text" 
                            value={lots} 
                            onChange={(e) => setLots(validateNumberInput(e.target.value))} 
                        />
                        <div className="order-modal-spinners">
                            <button className="order-btn-spin up" onClick={() => handleLotChange(0.01)}><ChevronUp size={12} /></button>
                            <button className="order-btn-spin down" onClick={() => handleLotChange(-0.01)}><ChevronDown size={12} /></button>
                        </div>
                    </div>
                </div>
                <div className="order-modal-input-group">
                    <label>Contract</label>
                    <input className="order-modal-basic-input" type="text" value="1000.00" readOnly />
                </div>
                <div className="order-modal-input-group">
                    <label>Margin</label>
                    <input className="order-modal-basic-input" type="text" value="7.11" readOnly />
                </div>
            </div>

            <div className="order-modal-info-row">
                <div className="order-info-item">
                    <span className="order-info-label">Spread</span>
                    <span className="order-info-val">1.40</span>
                </div>
                <div className="order-info-item">
                    <span className="order-info-label">Comm</span>
                    <span className="order-info-val">10.00</span>
                </div>
                <div className="order-info-item">
                    <span className="order-info-label">Pip</span>
                    <span className="order-info-val">10 USD</span>
                </div>
                <div className="order-info-item swap-item">
                    <span className="order-info-label">Swap</span>
                    <span className="order-info-val">Buy: -1.595</span>
                    <span className="order-info-val">Sell: -1.104</span>
                </div>
            </div>

            <div className="order-modal-actions">
                <button className="order-action-btn sell-btn">SELL</button>
                <button className="order-action-btn buy-btn">BUY</button>
            </div>
        </div>
    );
}
