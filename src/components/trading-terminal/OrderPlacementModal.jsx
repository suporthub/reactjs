import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import './trading-terminal.css';

export default function OrderPlacementModal({ symbol, bid, ask, onClose }) {
    const [lots, setLots] = useState('0.01');
    const [activeTab, setActiveTab] = useState('Instant');

    const handleLotChange = (delta) => {
        setLots(prev => {
            const current = parseFloat(prev) || 0;
            const newValue = Math.max(0.01, current + delta);
            return newValue.toFixed(2);
        });
    };

    return (
        <div className="order-modal-content">
            <div className="order-modal-header">
                <h3 className="order-modal-title">{symbol}</h3>
                <button className="order-modal-close" onClick={onClose}>
                    <X size={18} color="#DA5244" strokeWidth={3} />
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
                    <span className="order-modal-price-val sell-color">{bid || '0.96531'}</span>
                </div>
                <div className="order-modal-price-box">
                    <span className="order-modal-price-label">Ask Price:</span>
                    <span className="order-modal-price-val buy-color">{ask || '0.96545'}</span>
                </div>
            </div>

            {(activeTab === 'Limit' || activeTab === 'Stop') && (
                <div className="order-modal-limit-input">
                    <input 
                        type="text" 
                        className="order-modal-full-input" 
                        placeholder={`Current market price: ${ask || '0.96545'}`} 
                    />
                </div>
            )}

            <div className="order-modal-inputs">
                <div className="order-modal-input-group">
                    <label>Lots</label>
                    <div className="order-modal-number-input">
                        <input type="text" value={lots} onChange={(e) => setLots(e.target.value)} />
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
