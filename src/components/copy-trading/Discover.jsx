import React from 'react';
import { ChevronRight, Users, Star } from 'lucide-react';

const ProviderBoxCard = ({ name, _return, returnType, investors, drawdown, isYellowStar }) => (
    <div className="provider-box-card">
        <div className="provider-box-top">
            <div className={`provider-box-icon`}>
                <Users size={28} />
            </div>
            <div className="provider-box-title">{name}</div>
            <button className={`btn-star-box ${isYellowStar ? 'yellow' : ''}`}>
                <Star size={14} fill={isYellowStar ? "currentColor" : "none"} />
            </button>
        </div>
        <div className="provider-box-bottom">
            <div className="provider-box-stat-left">
                <span className="stat-label">Return</span>
                <span className={`stat-val ${returnType}`}>{_return}</span>
            </div>
            <div className="provider-box-stat-right">
                <span className="stat-val"><Users size={12} className="stat-icon-users" /> {investors}</span>
                <span className="stat-drawdown"><span style={{ color: '#ed7d31', marginRight: '4px' }}>&#128176;</span>{drawdown}</span>
            </div>
        </div>
    </div>
);

const AllStrategyCard = ({ name, _return, returnType, investors, isYellowStar }) => (
    <div className="all-strategy-card">
        <div className={`all-box-top`}>
            <Users size={40} color="#5b9bd5" style={{ margin: 'auto' }} />
            <button className={`btn-star-box ${isYellowStar ? 'yellow' : ''}`}>
                <Star size={14} fill={isYellowStar ? "currentColor" : "none"} />
            </button>
        </div>
        <div className="all-box-bottom">
            <h4>{name}</h4>
            <div className="all-box-stats">
                <span className={`return-val ${returnType}`}>
                    <span style={{ color: '#5b9bd5', marginRight: '4px' }}>
                        {returnType === 'positive' ? '📈' : '📉'}
                    </span>
                    {_return}
                </span>
                <span className="investors-val"><Users size={14} /> {investors}</span>
            </div>
        </div>
    </div>
);

const ScrollableRow = ({ children }) => {
    const scrollRef = React.useRef(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
        }
    };

    React.useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [children]);

    const handleScrollRight = () => {
        if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    };

    const handleScrollLeft = () => {
        if (scrollRef.current) scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    };

    return (
        <div className="scroll-wrapper">
            {canScrollLeft && (
                <button className="scroll-nav-btn left" onClick={handleScrollLeft}>
                    <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                </button>
            )}
            <div className="horizontal-scroll" ref={scrollRef} onScroll={checkScroll}>
                {children}
            </div>
            {canScrollRight && (
                <button className="scroll-nav-btn right" onClick={handleScrollRight}>
                    <ChevronRight size={20} />
                </button>
            )}
        </div>
    );
};


export default function Discover() {
    return (
        <>
            {/* Pills Filters */}
            <div className="filter-pills">
                <button className="pill-btn active">All</button>
                <button className="pill-btn">Popular</button>
                <button className="pill-btn">Medium Risk</button>
                <button className="pill-btn">Best Return for 3 months</button>
                <button className="pill-btn">Low Fee</button>
                <button className="pill-btn">New Strategies</button>
            </div>

            {/* My Active Strategies */}
            <div className="section-block">
                <div className="section-title-row">
                    <h2>My active strategies</h2>
                    <button className="btn-see-all">See all <ChevronRight size={16} /></button>
                </div>

                <div className="strategies-cards">
                    <div className="strategy-card">
                        <h3>kodidela_111</h3>
                        <p>Return 0% • Investors 0</p>
                    </div>
                    <div className="strategy-card">
                        <h3>sjsjjdjdfjffj</h3>
                        <p>Return -1% • Investors 0</p>
                    </div>
                    <div className="strategy-card">
                        <h3>ednndjfjfjf</h3>
                        <p>Return 0% • Investors 0</p>
                    </div>
                </div>
            </div>

            {/* Popular */}
            <div className="section-block">
                <div className="section-title-row">
                    <h2>Popular</h2>
                    <button className="btn-see-all">See all <ChevronRight size={16} /></button>
                </div>

                <div className="popular-grid">
                    <div className="popular-item">
                        <span className="rank-number">1</span>
                        <div className="provider-icon"><Users size={28} /></div>
                        <div className="provider-info">
                            <h4>Market mind</h4>
                            <div className="provider-stats">
                                <span className="return-val positive"><span style={{ color: '#5b9bd5', marginRight: '4px' }}>📈</span> 458.3908%</span>
                                <span className="drawdown"><span style={{ color: '#ed7d31', marginLeft: '8px', marginRight: '4px' }}>💰</span> 30%</span>
                            </div>
                        </div>
                        <div className="provider-investors">
                            <span className="inv-count">995</span>
                            <span className="inv-label">Investors</span>
                        </div>
                    </div>

                    <div className="popular-item">
                        <span className="rank-number">2</span>
                        <div className="provider-icon"><Users size={28} /></div>
                        <div className="provider-info">
                            <h4>Commodities</h4>
                            <div className="provider-stats">
                                <span className="return-val positive"><span style={{ color: '#5b9bd5', marginRight: '4px' }}>📈</span> 239.0059%</span>
                                <span className="drawdown"><span style={{ color: '#ed7d31', marginLeft: '8px', marginRight: '4px' }}>💰</span> 20%</span>
                            </div>
                        </div>
                        <div className="provider-investors">
                            <span className="inv-count">889</span>
                            <span className="inv-label">Investors</span>
                        </div>
                    </div>

                    <div className="popular-item">
                        <span className="rank-number">3</span>
                        <div className="provider-icon"><Users size={28} /></div>
                        <div className="provider-info">
                            <h4>Bull market</h4>
                            <div className="provider-stats">
                                <span className="return-val positive"><span style={{ color: '#5b9bd5', marginRight: '4px' }}>📈</span> 160.55%</span>
                                <span className="drawdown"><span style={{ color: '#ed7d31', marginLeft: '8px', marginRight: '4px' }}>💰</span> 20%</span>
                            </div>
                        </div>
                        <div className="provider-investors">
                            <span className="inv-count">320</span>
                            <span className="inv-label">Investors</span>
                        </div>
                    </div>

                    <div className="popular-item">
                        <span className="rank-number">4</span>
                        <div className="provider-icon"><Users size={28} /></div>
                        <div className="provider-info">
                            <h4>Pro Trader Luffy</h4>
                            <div className="provider-stats">
                                <span className="return-val negative"><span style={{ color: '#5b9bd5', marginRight: '4px' }}>📉</span> -3.0156%</span>
                                <span className="drawdown"><span style={{ color: '#ed7d31', marginLeft: '8px', marginRight: '4px' }}>💰</span> 5%</span>
                            </div>
                        </div>
                        <div className="provider-investors">
                            <span className="inv-count">25</span>
                            <span className="inv-label">Investors</span>
                        </div>
                    </div>

                    <div className="popular-item">
                        <span className="rank-number">5</span>
                        <div className="provider-icon"><Users size={28} /></div>
                        <div className="provider-info">
                            <h4>Ram Jay 40</h4>
                            <div className="provider-stats">
                                <span className="return-val negative"><span style={{ color: '#5b9bd5', marginRight: '4px' }}>📉</span> -137.7385%</span>
                                <span className="drawdown"><span style={{ color: '#ed7d31', marginLeft: '8px', marginRight: '4px' }}>💰</span> 20%</span>
                            </div>
                        </div>
                        <div className="provider-investors">
                            <span className="inv-count">12</span>
                            <span className="inv-label">Investors</span>
                        </div>
                    </div>

                    <div className="popular-item">
                        <span className="rank-number">6</span>
                        <div className="provider-icon"><Users size={28} /></div>
                        <div className="provider-info">
                            <h4>providerr_10</h4>
                            <div className="provider-stats">
                                <span className="return-val positive"><span style={{ color: '#5b9bd5', marginRight: '4px' }}>📈</span> 330.1777%</span>
                                <span className="drawdown"><span style={{ color: '#ed7d31', marginLeft: '8px', marginRight: '4px' }}>💰</span> 5%</span>
                            </div>
                        </div>
                        <div className="provider-investors">
                            <span className="inv-count">3</span>
                            <span className="inv-label">Investors</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Medium Risk */}
            <div className="section-block">
                <div className="section-title-row">
                    <h2>Medium Risk</h2>
                    <button className="btn-see-all">See all <ChevronRight size={16} /></button>
                </div>
                <ScrollableRow>
                    <ProviderBoxCard name="providerr_10" _return="330.1777%" returnType="positive" investors="3" drawdown="5%" />
                    <ProviderBoxCard name="Commodities" _return="239.0059%" returnType="positive" investors="889" drawdown="20%" isYellowStar />
                    <ProviderBoxCard name="Bull market" _return="160.55%" returnType="positive" investors="320" drawdown="20%" />
                    <ProviderBoxCard name="Fathima Strategies" _return="86.8424%" returnType="positive" investors="0" drawdown="5%" />
                    <ProviderBoxCard name="Fx Reem 1000" _return="63.158%" returnType="positive" investors="0" drawdown="5%" />
                </ScrollableRow>
            </div>

            {/* Best Return for 3 months */}
            <div className="section-block">
                <div className="section-title-row">
                    <h2>Best Return for 3 months</h2>
                    <button className="btn-see-all">See all <ChevronRight size={16} /></button>
                </div>
                <ScrollableRow>
                    <ProviderBoxCard name="Market mind" _return="458.3908%" returnType="positive" investors="995" drawdown="30%" />
                    <ProviderBoxCard name="Bull market" _return="160.55%" returnType="positive" investors="320" drawdown="20%" />
                    <ProviderBoxCard name="providerr_10" _return="330.1777%" returnType="positive" investors="3" drawdown="5%" />
                    <ProviderBoxCard name="Commodities" _return="239.0059%" returnType="positive" investors="889" drawdown="20%" isYellowStar />
                    <ProviderBoxCard name="Ram Jay 40" _return="-137.7385%" returnType="negative" investors="12" drawdown="20%" />
                </ScrollableRow>
            </div>

            {/* Low Fee */}
            <div className="section-block">
                <div className="section-title-row">
                    <h2>Low Fee</h2>
                    <button className="btn-see-all">See all <ChevronRight size={16} /></button>
                </div>
                <ScrollableRow>
                    <ProviderBoxCard name="Pro Trader Luffy" _return="-3.0156%" returnType="negative" investors="25" drawdown="5%" />
                    <ProviderBoxCard name="Dragon Warrior1" _return="0%" returnType="neutral" investors="0" drawdown="5%" />
                    <ProviderBoxCard name="Fathima Strategies" _return="86.8424%" returnType="positive" investors="0" drawdown="5%" />
                    <ProviderBoxCard name="Fx Reem 1000" _return="63.158%" returnType="positive" investors="0" drawdown="5%" />
                </ScrollableRow>
            </div>

            {/* New Strategies */}
            <div className="section-block">
                <div className="section-title-row">
                    <h2>New Strategies</h2>
                    <button className="btn-see-all">See all <ChevronRight size={16} /></button>
                </div>
                <ScrollableRow>
                    <ProviderBoxCard name="new_testing" _return="-3.92%" returnType="negative" investors="1" drawdown="5%" />
                    <ProviderBoxCard name="My self new" _return="13.49%" returnType="positive" investors="0" drawdown="10%" />
                    <ProviderBoxCard name="GBPUSD trading" _return="-91.792%" returnType="negative" investors="0" drawdown="5%" />
                    <ProviderBoxCard name="newwww_7656e" _return="-5.45%" returnType="negative" investors="0" drawdown="5%" />
                    <ProviderBoxCard name="app2" _return="3.5733%" returnType="positive" investors="0" drawdown="5%" />
                </ScrollableRow>
            </div>

            {/* All */}
            <div className="section-block">
                <div className="section-title-row">
                    <h2>All</h2>
                    <button className="btn-see-all">See all <ChevronRight size={16} /></button>
                </div>
                <ScrollableRow>
                    <AllStrategyCard name="Market mind" _return="458.3908%" returnType="positive" investors="995" customBg="market-mind" />
                    <AllStrategyCard name="providerr_10" _return="330.1777%" returnType="positive" investors="3" />
                    <AllStrategyCard name="Commodities" _return="239.0059%" returnType="positive" investors="889" isYellowStar />
                    <AllStrategyCard name="Bull market" _return="160.55%" returnType="positive" investors="320" customBg="bull-market" />
                    <AllStrategyCard name="Fathima Strategies" _return="86.8424%" returnType="positive" investors="0" />
                    <AllStrategyCard name="Fx Reem 1000" _return="63.158%" returnType="positive" investors="0" />
                    <AllStrategyCard name="My self new" _return="13.49%" returnType="positive" investors="0" />
                </ScrollableRow>
            </div>
        </>
    );
}
