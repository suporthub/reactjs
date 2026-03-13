import React, { useState } from 'react';
import { Search, Star, PanelLeftClose } from 'lucide-react';
import OrderPlacementModal from './OrderPlacementModal';

const MARKET_DATA = [
    { symbol: 'AUDCAD', bid: '0.9512', ask: '0.9614', change: '+0.12%', bidLow: '0.94741', bidHigh: '0.96329', starred: true, direction: 'up' },
    { symbol: 'AUDCHF', bid: '0.5468', ask: '0.5470', change: '+0.04%', bidLow: '0.55415', bidHigh: '0.55279', starred: true, direction: 'up' },
    { symbol: 'AUDCNH', bid: '4.8573', ask: '4.8577', change: '-0.14%', bidLow: '4.85098', bidHigh: '4.86694', starred: true, direction: 'down' },
    { symbol: 'AUDHKD', bid: '5.4845', ask: '5.4850', change: '+0.07%', bidLow: '5.45889', bidHigh: '5.49799', starred: false, direction: 'up' },
    { symbol: 'AUDJPY', bid: '111.14', ask: '111.16', change: '-0.01%', bidLow: '110.757', bidHigh: '111.311', starred: false, direction: 'down' },
    { symbol: 'AUDNZD', bid: '1.1878', ask: '1.1880', change: '-0.24%', bidLow: '1.18743', bidHigh: '1.19095', starred: false, direction: 'down' },
    { symbol: 'EURUSD', bid: '1.0842', ask: '1.0844', change: '+0.18%', bidLow: '1.08200', bidHigh: '1.08650', starred: true, direction: 'up' },
    { symbol: 'GBPUSD', bid: '1.2695', ask: '1.2697', change: '+0.09%', bidLow: '1.26780', bidHigh: '1.27100', starred: false, direction: 'up' },
    { symbol: 'USDJPY', bid: '149.85', ask: '149.87', change: '-0.05%', bidLow: '149.500', bidHigh: '150.200', starred: false, direction: 'down' },
    { symbol: 'XAUUSD', bid: '2178.5', ask: '2179.0', change: '+0.32%', bidLow: '2170.00', bidHigh: '2185.00', starred: true, direction: 'up' },
];

const CATEGORIES = ['★', 'Currencies', 'Commodities', 'Indices', 'Crypto'];

export default function MarketSidebar({ selectedSymbol, setSelectedSymbol, onToggleSidebar }) {
    const [marketData, setMarketData] = useState(MARKET_DATA);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Currencies');
    const [modalData, setModalData] = useState(null);

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
        return matchesSearch;
    });

    return (
        <div className="market-sidebar">
            {modalData ? (
                <OrderPlacementModal
                    symbol={modalData.symbol}
                    bid={modalData.bid}
                    ask={modalData.ask}
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
                                    <span className={`market-arrow ${item.direction === 'up' ? 'arrow-up' : 'arrow-down'}`}>
                                        {item.direction === 'up' ? '▲' : '▼'}
                                    </span>
                                    <span className={`market-change ${item.direction === 'up' ? 'positive' : 'negative'}`}>
                                        {item.change}
                                    </span>
                                </div>
                                <div className="market-price-col">
                                    <span className={`market-bid-price ${item.direction === 'up' ? 'price-up' : 'price-down'}`}>
                                        {item.bid}
                                        <sup className="market-price-sup">{Math.floor(Math.random() * 9) + 1}</sup>
                                    </span>
                                    <span className="market-price-range-val">L: {item.bidLow}</span>
                                </div>
                                <div className="market-price-col">
                                    <span className={`market-ask-price ${item.direction === 'up' ? 'price-up' : 'price-down'}`}>
                                        {item.ask}
                                        <sup className="market-price-sup">{Math.floor(Math.random() * 9) + 1}</sup>
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
