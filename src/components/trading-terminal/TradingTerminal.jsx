import React, { useState, useCallback, useEffect, useRef } from 'react';
import TerminalTopbar from './TerminalTopbar';
import MarketSidebar from './MarketSidebar';
import ChartMain from './ChartMain';
import OrdersPanel from './OrdersPanel';
import MarginBar from './MarginBar';
import { refreshTradingToken, getTradingAccessToken } from '../../utils/tradingTokenManager';
import { tradingConfigManager } from '../../utils/tradingConfigCache';
import './trading-terminal.css';

import { PanelLeftOpen } from 'lucide-react';

// Token refresh interval: 13 minutes (token expires in 15min / 900s)
const TOKEN_REFRESH_INTERVAL_MS = 13 * 60 * 1000;

export default function TradingTerminal() {
    const [selectedSymbol, setSelectedSymbol] = useState(() => {
        return localStorage.getItem('recent_symbol') || 'AUDCAD';
    });
    const [selectedTimeframe, setSelectedTimeframe] = useState(() => {
        return localStorage.getItem('recent_tf') || '30m';
    });

    // Persist selected symbol and timeframe to localStorage for session recovery
    useEffect(() => {
        if (selectedSymbol) {
            localStorage.setItem('recent_symbol', selectedSymbol);
        }
    }, [selectedSymbol]);

    useEffect(() => {
        if (selectedTimeframe) {
            localStorage.setItem('recent_tf', selectedTimeframe);
        }
    }, [selectedTimeframe]);

    // Ensure we have a valid symbol from config if current is somehow empty
    useEffect(() => {
        const initDefaultSymbol = async () => {
            const config = await tradingConfigManager.getConfig();
            if (config?.symbols?.length > 0 && !selectedSymbol) {
                const fallback = localStorage.getItem('recent_symbol') || config.symbols[0].symbol || 'AUDCAD';
                setSelectedSymbol(fallback);
            }
        };
        initDefaultSymbol();
    }, [selectedSymbol]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isOrdersPanelMinimized, setIsOrdersPanelMinimized] = useState(false);
    const isDraggingRef = useRef(false);
    const isDraggingSidebarRef = useRef(false);
    const ordersPanelRef = useRef(null);
    const sidebarRef = useRef(null);

    // Advanced, ultra-smooth drag logic bypassing React state for 60fps rendering
    const handleMouseDown = useCallback((e) => {
        if (isOrdersPanelMinimized) return;
        e.preventDefault();
        isDraggingRef.current = true;
        document.body.style.cursor = 'row-resize';
        // Prevent generic pointer events (like iframe or map interactions catching the mouse)
        document.body.classList.add('resizing-active');
    }, [isOrdersPanelMinimized]);

    const handleSidebarMouseDown = useCallback((e) => {
        e.preventDefault();
        isDraggingSidebarRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.classList.add('resizing-active-col');
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (isDraggingRef.current && ordersPanelRef.current && !isOrdersPanelMinimized) {
            // Direct DOM manipulation guarantees immediate feedback without waiting for React re-renders
            const marginBarHeight = 36;
            const newHeightPx = window.innerHeight - e.clientY - marginBarHeight;
            let newHeightVh = (newHeightPx / window.innerHeight) * 100;

            // Constrain height accurately between requested 20% and 70%
            if (newHeightVh < 20) newHeightVh = 20;
            if (newHeightVh > 70) newHeightVh = 70;

            ordersPanelRef.current.style.height = `${newHeightVh}vh`;
        }

        if (isDraggingSidebarRef.current && sidebarRef.current && isSidebarVisible) {
            let newWidthPx = e.clientX;

            // Allow user to shrink sidebar manually below initial sizes
            const minW = 320;
            const maxW = window.innerWidth * 0.45;

            if (newWidthPx < minW) newWidthPx = minW;
            if (newWidthPx > maxW) newWidthPx = maxW;

            sidebarRef.current.style.width = `${newWidthPx}px`;
        }
    }, [isSidebarVisible, isOrdersPanelMinimized]);

    const handleMouseUp = useCallback(() => {
        if (isDraggingRef.current || isDraggingSidebarRef.current) {
            isDraggingRef.current = false;
            isDraggingSidebarRef.current = false;
            document.body.style.cursor = '';
            document.body.classList.remove('resizing-active');
            document.body.classList.remove('resizing-active-col');
        }
    }, []);

    // Bind document events globally so drag works even if mouse leaves the resizer pixel
    useEffect(() => {
        const handleWindowResize = () => {
            if (sidebarRef.current && !isDraggingSidebarRef.current) {
                // Clear custom drag width on window resize so it snaps back naturally
                sidebarRef.current.style.width = '';
            }
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('resize', handleWindowResize);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('resize', handleWindowResize);
        };
    }, [handleMouseMove, handleMouseUp]);

    // ── Proactive token refresh timer ──────────────────────────────
    // Silently refreshes the trading token every ~13min to stay ahead
    // of the 15-minute expiry window, preventing 401 errors entirely.
    useEffect(() => {
        // Only set up if we have a token (i.e. user is authenticated)
        if (!getTradingAccessToken()) return;

        // Ensure trading configuration is loaded/cached immediately
        tradingConfigManager.getConfig();

        const refreshInterval = setInterval(async () => {
            console.log('[TradingTerminal] Proactive token refresh triggered');
            const newToken = await refreshTradingToken();
            if (newToken) {
                // Notify all child components (WebSockets, etc.)
                window.dispatchEvent(new CustomEvent('tradingTokenRefreshed', {
                    detail: { accessToken: newToken }
                }));
            }
        }, TOKEN_REFRESH_INTERVAL_MS);

        // Log when any component refreshes the token
        const handleTokenRefreshed = (e) => {
            console.log('[TradingTerminal] Token refreshed event received — all connections updated');
        };
        window.addEventListener('tradingTokenRefreshed', handleTokenRefreshed);

        return () => {
            clearInterval(refreshInterval);
            window.removeEventListener('tradingTokenRefreshed', handleTokenRefreshed);
        };
    }, []);

    return (
        <div className="terminal-container">
            <TerminalTopbar />
            <div className="terminal-body">
                {/* Upper section: Data heavy sidebar + chart (Shrinks automatically due to flex: 1) */}
                <div className="terminal-upper">
                    {!isSidebarVisible && (
                        <div className="sidebar-collapsed-bar">
                            <button
                                className="sidebar-restore-btn-new"
                                onClick={() => setIsSidebarVisible(true)}
                                title="Open Sidebar"
                            >
                                <PanelLeftOpen size={16} />
                            </button>
                        </div>
                    )}
                    
                    <div 
                        ref={sidebarRef} 
                        className="market-sidebar-wrapper"
                        style={{ display: isSidebarVisible ? 'block' : 'none' }}
                    >
                        <MarketSidebar
                            selectedSymbol={selectedSymbol}
                            setSelectedSymbol={setSelectedSymbol}
                            onToggleSidebar={() => setIsSidebarVisible(false)}
                        />
                    </div>

                    {/* Vertical Resizer Handle */}
                    <div
                        className="terminal-resizer-vertical"
                        onMouseDown={handleSidebarMouseDown}
                        style={{
                            width: '2px',
                            background: 'rgba(139, 148, 158, 0.3)',
                            cursor: 'col-resize',
                            zIndex: 50,
                            transition: 'background 0.2s ease',
                            flexShrink: 0,
                            display: isSidebarVisible ? 'block' : 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139, 148, 158, 0.3)'}
                    />

                    <ChartMain
                        selectedSymbol={selectedSymbol}
                        selectedTimeframe={selectedTimeframe}
                        setSelectedTimeframe={setSelectedTimeframe}
                        onSelectSymbol={setSelectedSymbol}
                    />
                </div>

                {/* Responsive Resizer Handle */}
                {!isOrdersPanelMinimized && (
                    <div
                        className="terminal-resizer"
                        onMouseDown={handleMouseDown}
                        style={{
                            height: '2px',
                            background: 'rgba(139, 148, 158, 0.3)',
                            cursor: 'row-resize',
                            zIndex: 50,
                            transition: 'background 0.2s ease',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139, 148, 158, 0.3)'}
                    />
                )}

                {/* Orders Panel wrapped securely in dynamic height container */}
                <div
                    ref={ordersPanelRef}
                    className={`orders-panel-wrapper ${isOrdersPanelMinimized ? 'minimized' : ''}`}
                    style={{
                        height: isOrdersPanelMinimized ? '34px' : '28vh',
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'height 0.3s ease'
                    }}
                >
                    <OrdersPanel
                        isMinimized={isOrdersPanelMinimized}
                        onToggleMinimize={() => setIsOrdersPanelMinimized(!isOrdersPanelMinimized)}
                    />
                </div>

                <MarginBar />
            </div>
        </div>
    );
}
