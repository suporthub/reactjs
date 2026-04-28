import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { tradingConfigManager } from '../../utils/tradingConfigCache';
import { calculateMarginInUSD } from '../../utils/marginCalculator';
import './trading-terminal.css';

export default function OrderPlacementModal({ symbol, bid, ask, tickDirection, allMarketData, onClose }) {
    const [lots, setLots] = useState('0.01');
    const [price, setPrice] = useState('');
    const [activeTab, setActiveTab] = useState('Instant');
    const [symbolConfig, setSymbolConfig] = useState(null);
    const [leverage, setLeverage] = useState(100);
    const [lotsError, setLotsError] = useState('');
    const [slEnabled, setSlEnabled] = useState(false);
    const [tpEnabled, setTpEnabled] = useState(false);
    const [slVal, setSlVal] = useState('');
    const [tpVal, setTpVal] = useState('');
    const [isExitsOpen, setIsExitsOpen] = useState(false);
    const [timeMode, setTimeMode] = useState('GTC');
    const [timeVal, setTimeVal] = useState('');

    useEffect(() => {
        const loadConfig = async () => {
            const config = await tradingConfigManager.getConfig();
            if (config) {
                if (config.account && config.account.leverage) {
                    setLeverage(config.account.leverage);
                }
                if (config.symbols) {
                    const currentSymbol = config.symbols.find(s => s.symbol === symbol);
                    if (currentSymbol) {
                        setSymbolConfig(currentSymbol);
                        // Initialize lots to the symbol's minimum lot
                        setLots(currentSymbol.minLot.toString());
                    }
                }
            }
        };
        loadConfig();
    }, [symbol]);

    const validateNumberInput = (value) => {
        // Allow only numbers and a single decimal point
        const cleaned = value.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
        return cleaned;
    };

    const validateLots = (val) => {
        if (!symbolConfig) return;
        const num = parseFloat(val);
        if (isNaN(num)) {
            setLotsError('');
            return;
        }

        if (num < symbolConfig.minLot) {
            setLotsError(`Min: ${symbolConfig.minLot}`);
        } else if (num > symbolConfig.maxLot) {
            setLotsError(`Max: ${symbolConfig.maxLot}`);
        } else {
            setLotsError('');
        }
    };

    const handleLotChange = (delta) => {
        setLots(prev => {
            const current = parseFloat(prev) || 0;
            const min = symbolConfig?.minLot || 0.01;
            const max = symbolConfig?.maxLot || 100;
            
            let newValue = current + delta;
            if (newValue < min) newValue = min;
            if (newValue > max) newValue = max;
            
            const fixedValue = newValue.toFixed(2);
            setLotsError(''); // Clear error when using buttons as they respect bounds
            return fixedValue;
        });
    };

    return (
        <div className="order-modal-content">
            <button className="order-modal-close-btn" onClick={onClose}>
                <X size={16} strokeWidth={2.5} />
            </button>

            <div className="order-modal-header">
                <h3 className="order-modal-title">{symbol}</h3>
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

            <div className="order-modal-tabs secondary">
                {['GTC', 'FOK'].map(mode => (
                    <button 
                        key={mode} 
                        className={`order-modal-tab ${timeMode === mode ? 'active' : ''}`}
                        onClick={() => setTimeMode(mode)}
                    >
                        {mode}
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
                    <div style={{ position: 'relative', width: '100%' }}>
                        <div className={`order-modal-number-input ${lotsError ? 'has-error' : ''}`}>
                            <input 
                                type="text" 
                                value={lots} 
                                onChange={(e) => {
                                    const val = validateNumberInput(e.target.value);
                                    setLots(val);
                                    validateLots(val);
                                }} 
                            />
                            <div className="order-modal-spinners">
                                <button className="order-btn-spin up" onClick={() => handleLotChange(0.01)}><ChevronUp size={10} /></button>
                                <button className="order-btn-spin down" onClick={() => handleLotChange(-0.01)}><ChevronDown size={10} /></button>
                            </div>
                        </div>
                        {lotsError && <div className="lots-error-tooltip">{lotsError}</div>}
                    </div>
                </div>
                <div className="order-modal-input-group">
                    <label>Contract</label>
                    <input 
                        className="order-modal-basic-input" 
                        type="text" 
                        value={symbolConfig ? (symbolConfig.contractSize * parseFloat(lots || 0)).toFixed(2) : '0.00'} 
                        readOnly 
                    />
                </div>
                <div className="order-modal-input-group">
                    <label>Margin</label>
                    <input 
                        className="order-modal-basic-input" 
                        type="text" 
                        value={(() => {
                            if (!symbolConfig || !ask) return '0.00';
                            
                            const marginVal = calculateMarginInUSD(symbol, symbolConfig, ask, lots, leverage, allMarketData);
                            return marginVal.toFixed(2);
                        })()} 
                        readOnly 
                    />
                </div>
            </div>

            {/* Exits Section */}
            <div className="order-modal-exits-container">
                <div 
                    className="order-modal-exits-header" 
                    onClick={() => setIsExitsOpen(!isExitsOpen)}
                >
                    <span className="exits-title">Exits</span>
                    <ChevronDown size={14} className={`exits-chevron ${isExitsOpen ? 'open' : ''}`} />
                </div>

                {isExitsOpen && (
                    <div className="order-modal-exits-content">
                        {/* Take Profit Row */}
                        <div className="exit-row-inline">
                            <span className="exit-label">Take profit, price</span>
                            <input 
                                type="text" 
                                className="order-modal-toggle-input" 
                                placeholder="0.00000"
                                value={tpVal}
                                onChange={(e) => setTpVal(validateNumberInput(e.target.value))}
                            />
                        </div>

                        {/* Stop Loss Row */}
                        <div className="exit-row-inline">
                            <span className="exit-label">Stop loss, price</span>
                            <input 
                                type="text" 
                                className="order-modal-toggle-input" 
                                placeholder="0.00000"
                                value={slVal}
                                onChange={(e) => setSlVal(validateNumberInput(e.target.value))}
                            />
                        </div>
                    </div>
                )}
            </div>



            <div className="order-modal-info-row">
                <div className="order-info-item">
                    <span className="order-info-label">Spread</span>
                    <span className="order-info-val">
                        {symbolConfig ? symbolConfig.spread.toFixed(2) : '0.00'}
                    </span>
                </div>
                <div className="order-info-item">
                    <span className="order-info-label">Comm</span>
                    <span className="order-info-val">
                        {symbolConfig ? symbolConfig.commission.toFixed(2) : '0.00'}
                    </span>
                </div>
                <div className="order-info-item">
                    <span className="order-info-label">Pip</span>
                    <span className="order-info-val">
                        {(() => {
                            if (!symbolConfig) return '10.00 USD';
                            const pipSize = symbolConfig.spreadPip || 0.0001;
                            const lotsNum = parseFloat(lots || 0);
                            const basePipValue = lotsNum * symbolConfig.contractSize * pipSize;
                            
                            // Simple USD conversion for common forex pairs
                            const baseSymbol = symbol.split('.')[0].replace('+', '');
                            const quoteCurrency = baseSymbol.length >= 6 ? baseSymbol.substring(3, 6) : baseSymbol.slice(-3);
                            
                            let conversionRate = 1;
                            if (quoteCurrency !== 'USD' && allMarketData) {
                                const direct = allMarketData.find(m => m.symbol.startsWith(quoteCurrency + 'USD'));
                                if (direct) conversionRate = parseFloat(direct.bid);
                                else {
                                    const indirect = allMarketData.find(m => m.symbol.startsWith('USD' + quoteCurrency));
                                    if (indirect) conversionRate = 1 / parseFloat(indirect.bid);
                                }
                            }
                            
                            return `${(basePipValue * conversionRate).toFixed(2)} USD`;
                        })()}
                    </span>
                </div>
                <div className="order-info-item swap-item">
                    <span className="order-info-label">Swap</span>
                    <span className="order-info-val">Buy: {symbolConfig ? symbolConfig.swapBuy : '0.00'}</span>
                    <span className="order-info-val">Sell: {symbolConfig ? symbolConfig.swapSell : '0.00'}</span>
                </div>
            </div>

            <div className="order-modal-actions">
                <button className="order-action-btn sell-btn">SELL</button>
                <button className="order-action-btn buy-btn">BUY</button>
            </div>
        </div>
    );
}
