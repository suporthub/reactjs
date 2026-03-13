import React, { useState, useCallback, useEffect, useRef } from 'react';
import TerminalTopbar from './TerminalTopbar';
import MarketSidebar from './MarketSidebar';
import ChartMain from './ChartMain';
import OrdersPanel from './OrdersPanel';
import MarginBar from './MarginBar';
import './trading-terminal.css';

import { PanelLeftOpen } from 'lucide-react';

export default function TradingTerminal() {
    const [selectedSymbol, setSelectedSymbol] = useState('AUDCAD');
    const [selectedTimeframe, setSelectedTimeframe] = useState('30m');
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
            let newWidthPercent = (e.clientX / window.innerWidth) * 100;

            // Constrain width accurately between 20% and 40%
            if (newWidthPercent < 20) newWidthPercent = 20;
            if (newWidthPercent > 40) newWidthPercent = 40;

            sidebarRef.current.style.width = `${newWidthPercent}%`;
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
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

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
                    {isSidebarVisible && (
                        <>
                            <div ref={sidebarRef} className="market-sidebar-wrapper" style={{ width: '25%', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
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
                                    flexShrink: 0
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139, 148, 158, 0.3)'}
                            />
                        </>
                    )}

                    <ChartMain
                        selectedSymbol={selectedSymbol}
                        selectedTimeframe={selectedTimeframe}
                        setSelectedTimeframe={setSelectedTimeframe}
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
