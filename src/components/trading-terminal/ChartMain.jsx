import React, { useState, useEffect, useRef
} from 'react';
import {
    Crosshair, Minus, Plus, RotateCcw, RotateCw,
    Maximize2, Settings, Camera, Clock, TrendingUp,
    BarChart2, PenTool, Ruler, Type, Layers
} from 'lucide-react';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'];

// Generate fake candlestick data
function generateCandleData(count = 80) {
    const data = [];
    let basePrice = 0.9500;
    const now = Date.now();
    for (let i = 0; i < count; i++) {
        const open = basePrice + (Math.random() - 0.48) * 0.005;
        const close = open + (Math.random() - 0.48) * 0.008;
        const high = Math.max(open, close) + Math.random() * 0.003;
        const low = Math.min(open, close) - Math.random() * 0.003;
        data.push({
            time: now - (count - i) * 1800000,
            open, high, low, close,
            volume: Math.floor(Math.random() * 500) + 100
        });
        basePrice = close;
    }
    return data;
}

function drawChart(canvas, data, hoveredIndex) {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const chartTop = 30;
    const chartBottom = height - 30;
    const chartLeft = 0;
    const chartRight = width - 70;
    const chartHeight = chartBottom - chartTop;
    const chartWidth = chartRight - chartLeft;

    // Find price range
    let minPrice = Infinity, maxPrice = -Infinity;
    data.forEach(d => {
        if (d.low < minPrice) minPrice = d.low;
        if (d.high > maxPrice) maxPrice = d.high;
    });
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;
    minPrice -= padding;
    maxPrice += padding;
    const totalRange = maxPrice - minPrice;

    const priceToY = (price) => chartTop + (1 - (price - minPrice) / totalRange) * chartHeight;
    const candleWidth = Math.max(2, (chartWidth / data.length) * 0.6);
    const candleGap = chartWidth / data.length;

    // Grid lines
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.4)';
    ctx.lineWidth = 0.5;
    const gridLines = 6;
    for (let i = 0; i <= gridLines; i++) {
        const y = chartTop + (i / gridLines) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(chartLeft, y);
        ctx.lineTo(chartRight, y);
        ctx.stroke();

        // Price labels
        const price = maxPrice - (i / gridLines) * totalRange;
        ctx.fillStyle = '#8b949e';
        ctx.font = '11px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(price.toFixed(4), chartRight + 8, y + 4);
    }

    // Draw candles
    data.forEach((d, i) => {
        const x = chartLeft + i * candleGap + candleGap / 2;
        const isGreen = d.close >= d.open;
        const color = isGreen ? '#3687ED' : '#DA5244';

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, priceToY(d.high));
        ctx.lineTo(x, priceToY(d.low));
        ctx.stroke();

        // Body
        const bodyTop = priceToY(Math.max(d.open, d.close));
        const bodyBottom = priceToY(Math.min(d.open, d.close));
        const bodyHeight = Math.max(1, bodyBottom - bodyTop);

        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Current price line
    const lastCandle = data[data.length - 1];
    const lastY = priceToY(lastCandle.close);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = lastCandle.close >= lastCandle.open ? '#3687ED' : '#DA5244';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartLeft, lastY);
    ctx.lineTo(chartRight, lastY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price label
    const priceLabelColor = lastCandle.close >= lastCandle.open ? '#3687ED' : '#DA5244';
    ctx.fillStyle = priceLabelColor;
    const labelWidth = 65;
    const labelHeight = 20;
    ctx.fillRect(chartRight, lastY - labelHeight / 2, labelWidth, labelHeight);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(lastCandle.close.toFixed(5), chartRight + labelWidth / 2, lastY + 4);

    // Crosshair on hover
    if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < data.length) {
        const hx = chartLeft + hoveredIndex * candleGap + candleGap / 2;
        ctx.strokeStyle = 'rgba(139, 148, 158, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hx, chartTop);
        ctx.lineTo(hx, chartBottom);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Volume bars (small at the bottom)
    const volMax = Math.max(...data.map(d => d.volume));
    const volHeight = 40;
    data.forEach((d, i) => {
        const x = chartLeft + i * candleGap + candleGap / 2;
        const isGreen = d.close >= d.open;
        const barH = (d.volume / volMax) * volHeight;
        ctx.fillStyle = isGreen ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(x - candleWidth / 2, chartBottom - barH, candleWidth, barH);
    });

    // Time labels
    ctx.fillStyle = '#8b949e';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    const timeStep = Math.floor(data.length / 6);
    for (let i = 0; i < data.length; i += timeStep) {
        const x = chartLeft + i * candleGap + candleGap / 2;
        const date = new Date(data[i].time);
        const label = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        ctx.fillText(label, x, height - 8);
    }
}

export default function ChartMain({ selectedSymbol, selectedTimeframe, setSelectedTimeframe }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [candleData] = useState(() => generateCandleData(80));
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Get OHLC info for header
    const lastCandle = candleData[candleData.length - 1];
    const changeVal = lastCandle.close - candleData[0].open;
    const changePct = ((changeVal / candleData[0].open) * 100).toFixed(2);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            canvas.logicalWidth = rect.width;
            canvas.logicalHeight = rect.height;
            drawChart(canvas, candleData, hoveredIndex);
        };

        resize();
        
        const observer = new ResizeObserver(() => {
            window.requestAnimationFrame(resize);
        });
        observer.observe(container);
        
        return () => observer.disconnect();
    }, [candleData, hoveredIndex]);

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const chartRight = (canvas.logicalWidth || rect.width) - 70;
        const candleGap = chartRight / candleData.length;
        const idx = Math.floor(x / candleGap);
        setHoveredIndex(idx >= 0 && idx < candleData.length ? idx : null);
    };

    const handleMouseLeave = () => setHoveredIndex(null);

    return (
        <div className="chart-main">
            {/* Chart Toolbar */}
            <div className="chart-toolbar">
                <div className="chart-toolbar-left">
                    {TIMEFRAMES.map(tf => (
                        <button
                            key={tf}
                            className={`chart-tf-btn ${selectedTimeframe === tf ? 'active' : ''}`}
                            onClick={() => setSelectedTimeframe(tf)}
                        >
                            {tf}
                        </button>
                    ))}
                    <div className="chart-toolbar-divider"></div>
                    <button className="chart-tool-btn" title="Crosshair">
                        <Crosshair size={15} />
                    </button>
                    <button className="chart-tool-btn" title="Indicators">
                        <Layers size={15} />
                        <span>Indicators</span>
                    </button>
                </div>
                <div className="chart-toolbar-right">
                    <span className="chart-save-label">Save</span>
                    <div className="chart-toolbar-divider"></div>
                    <button className="chart-tool-btn" title="Undo">
                        <RotateCcw size={14} />
                    </button>
                    <button className="chart-tool-btn" title="Redo">
                        <RotateCw size={14} />
                    </button>
                    <div className="chart-toolbar-divider"></div>
                    <button className="chart-tool-btn" title="Screenshot">
                        <Camera size={14} />
                    </button>
                    <button className="chart-tool-btn" title="Settings">
                        <Settings size={14} />
                    </button>
                    <button className="chart-tool-btn" title="Fullscreen">
                        <Maximize2 size={14} />
                    </button>
                </div>
            </div>

            {/* OHLC Info Bar */}
            <div className="chart-info-bar">
                <span className="chart-symbol-label">{selectedSymbol} · {selectedTimeframe.toUpperCase()}</span>
                <span className="chart-ohlc-dot" style={{ color: '#3687ED' }}>●</span>
                <span className="chart-ohlc-item">O<span className="chart-ohlc-val">{lastCandle.open.toFixed(5)}</span></span>
                <span className="chart-ohlc-item">H<span className="chart-ohlc-val">{lastCandle.high.toFixed(5)}</span></span>
                <span className="chart-ohlc-item">L<span className="chart-ohlc-val">{lastCandle.low.toFixed(5)}</span></span>
                <span className="chart-ohlc-item">C<span className="chart-ohlc-val">{lastCandle.close.toFixed(5)}</span></span>
                <span className={`chart-ohlc-change ${changeVal >= 0 ? 'positive' : 'negative'}`}>
                    {changeVal >= 0 ? '+' : ''}{changeVal.toFixed(5)} ({changePct}%)
                </span>
            </div>

            {/* Drawing Tools (Left Side) */}
            <div className="chart-area-wrapper">
                <div className="chart-drawing-tools">
                    <button className="chart-draw-btn" title="Crosshair"><Crosshair size={16} /></button>
                    <button className="chart-draw-btn" title="Trend Line"><TrendingUp size={16} /></button>
                    <button className="chart-draw-btn" title="Horizontal Line"><Minus size={16} /></button>
                    <button className="chart-draw-btn" title="Ruler"><Ruler size={16} /></button>
                    <button className="chart-draw-btn" title="Pen"><PenTool size={16} /></button>
                    <button className="chart-draw-btn" title="Text"><Type size={16} /></button>
                    <div className="chart-draw-divider"></div>
                    <button className="chart-draw-btn" title="Bar Chart"><BarChart2 size={16} /></button>
                    <button className="chart-draw-btn" title="Settings"><Settings size={16} /></button>
                </div>

                {/* Canvas Chart */}
                <div className="chart-canvas-container" ref={containerRef}>
                    <canvas
                        ref={canvasRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="chart-canvas"
                    />
                    {/* TradingView watermark */}
                    <div className="chart-watermark">
                        <span className="chart-tv-logo">Tᐯ</span>
                    </div>
                </div>
            </div>

            {/* Symbol Tabs */}
            <div className="chart-symbol-tabs">
                <button className="chart-symbol-tab active">{selectedSymbol}</button>
                <button className="chart-symbol-tab-add">+</button>
                <div className="chart-time-utc">
                    <Clock size={12} />
                    <span>{new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })} (UTC)</span>
                </div>
            </div>
        </div>
    );
}
