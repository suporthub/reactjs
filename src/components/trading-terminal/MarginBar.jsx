import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Info } from 'lucide-react';
import { portfolioManager } from '../../utils/portfolioCache';
import { tradingConfigManager } from '../../utils/tradingConfigCache';

/**
 * MarginBar — Real-time portfolio metrics strip
 * 
 * Fetches balance, margin from the /api/portfolio/summary endpoint on mount.
 * Calculates Equity, Free Margin, Margin Level, and Total P/L dynamically
 * from live open-position data and real-time market prices.
 */
export default function MarginBar() {
    const [portfolio, setPortfolio] = useState(() => portfolioManager.getSnapshot());
    const [isLoading, setIsLoading] = useState(true);
    const [openPositions, setOpenPositions] = useState([]);
    const [symbolConfigs, setSymbolConfigs] = useState({});
    const [livePrices, setLivePrices] = useState({});
    const [showAutoCutoffInfo, setShowAutoCutoffInfo] = useState(false);
    const mountedRef = useRef(true);

    // ── Format helpers ──────────────────────────────────────────
    const fmt = useCallback((value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }, []);

    const fmtPct = useCallback((value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    }, []);

    const valueClass = useCallback((value) => {
        const num = parseFloat(value) || 0;
        if (num < 0) return 'negative';
        if (num > 0) return 'positive';
        return '';
    }, []);

    // ── USD conversion helper (same logic as OrdersPanel) ──────
    const getUSDConversionRate = useCallback((symbolName) => {
        if (!symbolName) return 1;
        const config = symbolConfigs[symbolName];
        if (!config) return 1;

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

        // Direct pair: e.g. GBPUSD
        const directPair = `${quoteCurrency}USD`;
        if (livePrices[directPair]?.bid) return parseFloat(livePrices[directPair].bid);

        // Indirect pair: e.g. USDJPY
        const indirectPair = `USD${quoteCurrency}`;
        if (livePrices[indirectPair]?.bid) return 1 / parseFloat(livePrices[indirectPair].bid);

        return 1;
    }, [symbolConfigs, livePrices]);

    // ── Initial fetch on mount ──────────────────────────────────
    useEffect(() => {
        mountedRef.current = true;

        (async () => {
            try {
                const [data, config] = await Promise.all([
                    portfolioManager.getSummary(/* force */ true),
                    tradingConfigManager.getConfig()
                ]);

                if (mountedRef.current) {
                    setPortfolio(data);
                    if (config?.symbols) {
                        const configMap = {};
                        config.symbols.forEach(s => { configMap[s.symbol] = s; });
                        setSymbolConfigs(configMap);
                    }
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('[MarginBar] Portfolio fetch failed:', err);
                if (mountedRef.current) setIsLoading(false);
            }
        })();

        return () => { mountedRef.current = false; };
    }, []);

    // ── Live updates via custom events ───────────────────────────
    useEffect(() => {
        const onPortfolioUpdate = (e) => {
            if (mountedRef.current && e.detail) {
                setPortfolio(e.detail);
            }
        };

        const onOrdersUpdate = (e) => {
            if (mountedRef.current && e.detail) {
                setOpenPositions(e.detail.open_positions || []);
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

        window.addEventListener('portfolioUpdated', onPortfolioUpdate);
        window.addEventListener('ordersUpdated', onOrdersUpdate);
        window.addEventListener('marketPriceUpdate', onPriceUpdate);
        return () => {
            window.removeEventListener('portfolioUpdated', onPortfolioUpdate);
            window.removeEventListener('ordersUpdated', onOrdersUpdate);
            window.removeEventListener('marketPriceUpdate', onPriceUpdate);
        };
    }, []);

    // ── Calculate total P/L from all open positions ─────────────
    const totalPL = openPositions.reduce((sum, order) => {
        const config = symbolConfigs[order.symbolName];
        const contractSize = config?.contractSize ?? 1;
        const live = livePrices[order.symbolName];
        const isBuy = (order.orderType || '').toUpperCase().includes('BUY');
        
        const displayMarketPrice = live 
            ? (isBuy ? live.bid : live.ask) 
            : order.marketPrice;

        const priceDiff = isBuy 
            ? (displayMarketPrice - order.openPrice)
            : (order.openPrice - displayMarketPrice);

        const conversionRate = getUSDConversionRate(order.symbolName);
        const floatingPL = (priceDiff * order.quantity * contractSize) * conversionRate;
        const finalPL = floatingPL - (order.commission || 0) + (order.swap || 0);

        return sum + (isNaN(finalPL) ? 0 : finalPL);
    }, 0);

    // ── Derived display values ──────────────────────────────────
    const balance      = parseFloat(portfolio.balance) || 0;
    const usedMargin   = parseFloat(portfolio.used_margin) || 0;

    // Dynamic calculations based on user's formulas
    const equity       = balance + totalPL;
    const freeMargin   = equity - usedMargin;
    const marginLevel  = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;

    // Dynamic signal strength based on network RTT
    const [activeBars, setActiveBars] = useState(4);

    useEffect(() => {
        const updateNetwork = () => {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn && conn.rtt !== undefined) {
                // RTT (Round Trip Time) in milliseconds
                if (conn.rtt < 100) setActiveBars(4); // Green
                else if (conn.rtt < 250) setActiveBars(3); // Yellow
                else if (conn.rtt < 500) setActiveBars(2); // Yellow
                else setActiveBars(1); // Red
            }
        };

        updateNetwork();
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            conn.addEventListener('change', updateNetwork);
        }
        
        // Polling as fallback for browsers that update RTT without firing 'change'
        const intervalId = setInterval(updateNetwork, 5000);

        return () => {
            if (conn) conn.removeEventListener('change', updateNetwork);
            clearInterval(intervalId);
        };
    }, []);

    const signalClass = activeBars === 4 ? 'signal-full' : (activeBars >= 2 ? 'signal-medium' : 'signal-low');

    // Shimmer placeholder while loading
    const shimmer = <span className="margin-value shimmer-value">—</span>;

    return (
        <div className="margin-bar">
            <div className="margin-bar-items">
                <div className="margin-bar-item">
                    <span className="margin-label">Balance:</span>
                    {isLoading ? shimmer : (
                        <span className="margin-value">
                            ${fmt(balance)}
                        </span>
                    )}
                </div>
                <div className="margin-bar-item">
                    <span className="margin-label">Equity:</span>
                    {isLoading ? shimmer : (
                        <span className="margin-value">
                            ${fmt(equity)}
                        </span>
                    )}
                </div>
                <div className="margin-bar-item">
                    <span className="margin-label">Margin:</span>
                    {isLoading ? shimmer : (
                        <span className="margin-value">
                            ${fmt(usedMargin)}
                        </span>
                    )}
                </div>
                <div className="margin-bar-item">
                    <span className="margin-label">Free Margin:</span>
                    {isLoading ? shimmer : (
                        <span className="margin-value">
                            ${fmt(freeMargin)}
                        </span>
                    )}
                </div>
                <div className="margin-bar-item">
                    <span className="margin-label">Margin Level:</span>
                    {isLoading ? shimmer : (
                        <span className="margin-value">
                            {fmtPct(marginLevel)}
                        </span>
                    )}
                </div>
                <div className="margin-bar-item" style={{ position: 'relative' }}>
                    <span className="margin-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Autocut-off:
                        <Info 
                            size={12} 
                            style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
                            onClick={() => setShowAutoCutoffInfo(!showAutoCutoffInfo)}
                        />
                    </span>
                    <span className="margin-value">90%</span>

                    {showAutoCutoffInfo && (
                        <>
                            {/* Invisible overlay to catch clicks outside */}
                            <div 
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                                onClick={() => setShowAutoCutoffInfo(false)}
                            />
                            <div className="autocutoff-tooltip">
                                If the margin level falls below the auto-cutoff threshold, all open positions will be closed automatically to protect your account from further losses. This process is designed to prevent your balance from going negative and to ensure account safety. Please monitor your margin level to avoid auto-cutoff.
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="margin-bar-right">
                <div className="margin-profit">
                    <span className="margin-label">Profit:</span>
                    {isLoading ? shimmer : (
                        <span className={`margin-value profit-highlight ${valueClass(totalPL)}`}>
                            ${fmt(totalPL)}
                        </span>
                    )}
                </div>
                <div className="margin-connection" style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', marginRight: '15px' }}>
                    <div className={`connection-bars ${signalClass}`}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`bar bar-${i} ${i <= activeBars ? 'active' : ''}`}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
