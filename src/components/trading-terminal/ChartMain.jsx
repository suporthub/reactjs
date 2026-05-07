import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { createDatafeed } from './datafeed';

const TIMEFRAMES = [
    { label: '1s', tv: '1S' },
    { label: '5s', tv: '5S' },
    { label: '15s', tv: '15S' },
    { label: '30s', tv: '30S' },
    { label: '1m', tv: '1' },
    { label: '5m', tv: '5' },
    { label: '15m', tv: '15' },
    { label: '30m', tv: '30' },
    { label: '1H', tv: '60' },
    { label: '2H', tv: '120' },
    { label: '4H', tv: '240' },
    { label: '8H', tv: '480' },
    { label: '1D', tv: '1D' },
    { label: '1W', tv: '1W' },
    { label: '1M', tv: '1M' },
];

const API_BASE = 'https://v3.livefxhub.com:8444/api/live/charts';

// ── TradingView chart loader ──────────────────────────────────
function loadTradingViewScript() {
    return new Promise((resolve, reject) => {
        if (window.TradingView) { resolve(); return; }
        const existing = document.getElementById('tv-charting-lib');
        if (existing) {
            existing.onload = resolve;
            existing.onerror = reject;
            return;
        }
        const script = document.createElement('script');
        script.id = 'tv-charting-lib';
        script.src = '/trading-view/charting_library/charting_library.standalone.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load TradingView charting library'));
        document.head.appendChild(script);
    });
}

// ── Main ChartMain component ─────────────────────────────────
export default function ChartMain({ selectedSymbol, selectedTimeframe, setSelectedTimeframe, onSelectSymbol }) {
    const containerRef = useRef(null);
    const widgetRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tradingMode, setTradingMode] = useState(() => localStorage.getItem('tradingMode') || 'Normal');
    const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');

    // ── Mode & Theme Listeners ──────────────────────────────────
    useEffect(() => {
        const handleModeChange = (e) => setTradingMode(e.detail.mode);
        const handleThemeChange = (e) => setTheme(e.detail.theme);
        
        window.addEventListener('tradingModeChanged', handleModeChange);
        window.addEventListener('themeChanged', handleThemeChange);

        const observer = new MutationObserver(() => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            setTheme(currentTheme);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => {
            window.removeEventListener('tradingModeChanged', handleModeChange);
            window.removeEventListener('themeChanged', handleThemeChange);
            observer.disconnect();
        };
    }, []);

    // Dynamic Recent Symbols list
    const [recentSymbols, setRecentSymbols] = useState(() => {
        const stored = localStorage.getItem('recent_symbols_list');
        if (stored) return JSON.parse(stored);
        return ['AUDCAD', 'XAUUSD', 'BTCUSD'];
    });

    useEffect(() => {
        if (!selectedSymbol) return;
        setRecentSymbols(prev => {
            const next = [selectedSymbol, ...prev.filter(s => s !== selectedSymbol)].slice(0, 8);
            localStorage.setItem('recent_symbols_list', JSON.stringify(next));
            return next;
        });
    }, [selectedSymbol]);

    // Singleton datafeed
    const datafeed = useMemo(() => createDatafeed(), []);

    // Active TradingView resolution
    const activeTf = useMemo(() => {
        return TIMEFRAMES.find(t => t.label === selectedTimeframe)?.tv || '30';
    }, [selectedTimeframe]);

    // ── Widget Initialization & Full Rebuild on Theme/Mode change ──
    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (!containerRef.current) return;
            setLoading(true);
            try {
                await loadTradingViewScript();
                if (!isMounted) return;

                if (widgetRef.current) {
                    try { widgetRef.current.remove(); } catch (_) { }
                }

                const isDark = theme === 'dark';
                const bgColor = isDark ? '#0d1117' : '#ffffff';
                const textColor = isDark ? '#8b949e' : '#24292f';
                const gridColor = isDark ? '#21262d' : '#f0f3fa';
                const primaryBlue = '#3687ED'; 
                const primaryRed = '#DA5244';

                console.log('[ChartMain] Initializing with theme:', theme, 'isDark:', isDark, 'bgColor:', bgColor);

                // ── Pre-fetch saved chart state from server ──
                const sym = selectedSymbol || 'AUDCAD';
                let savedState = null;
                let savedResolution = null;
                try {
                    const token = localStorage.getItem('tradingAccessToken');
                    if (token) {
                        const res = await fetch(`${API_BASE}/${sym}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                            const json = await res.json();
                            if (json?.data?.content) {
                                savedState = JSON.parse(json.data.content);
                                savedResolution = json.data.resolution;
                                console.log('[ChartMain] Loaded saved chart for', sym, 'resolution:', savedResolution);
                            }
                        }
                    }
                } catch (e) { console.warn('[ChartMain] Failed to fetch saved chart:', e); }

                const initialResolution = savedResolution || activeTf;

                // Intervals based on mode
                const intervals = tradingMode === 'Normal'
                    ? ['1', '5', '15', '30', '60', '240', '480', '1D', '1W']
                    : ['1S', '5S', '15S', '30S', '1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M'];

                // Explicitly clear container to prevent theme bleeding
                if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                    containerRef.current.style.backgroundColor = bgColor;
                }

                const overrides = {
                    'mainSeriesProperties.candleStyle.upColor': primaryBlue,
                    'mainSeriesProperties.candleStyle.downColor': primaryRed,
                    'mainSeriesProperties.candleStyle.wickUpColor': primaryBlue,
                    'mainSeriesProperties.candleStyle.wickDownColor': primaryRed,
                    'mainSeriesProperties.candleStyle.borderUpColor': primaryBlue,
                    'mainSeriesProperties.candleStyle.borderDownColor': primaryRed,
                    'paneProperties.background': bgColor,
                    'paneProperties.backgroundType': 'solid',
                    'scalesProperties.textColor': textColor,
                    'scalesProperties.lineColor': gridColor,
                    'paneProperties.vertGridProperties.color': gridColor,
                    'paneProperties.horzGridProperties.color': gridColor,
                    'scalesProperties.fontSize': 10,
                };

                const studiesOverrides = {
                    'volume.volume.color.0': primaryRed,
                    'volume.volume.color.1': primaryBlue,
                };

                widgetRef.current = new window.TradingView.widget({
                    container: containerRef.current,
                    library_path: '/trading-view/charting_library/',
                    locale: 'en',
                    symbol: sym,
                    interval: initialResolution,
                    datafeed: datafeed,
                    theme: isDark ? 'Dark' : 'Light',
                    style: '1',
                    toolbar_bg: bgColor,
                    overrides,
                    studies_overrides: studiesOverrides,
                    fullscreen: false,
                    autosize: true,
                    auto_save_delay: 5,
                    disabled_features: [
                        'header_symbol_search',
                        'header_compare',
                        'display_market_status',
                        'header_screenshot',
                        'go_to_date',
                        'bottom_toolbar',
                        'timeframes_toolbar',
                    ],
                    enabled_features: [
                        'side_toolbar_in_fullscreen_mode',
                        'header_fullscreen_button',
                        'hide_last_na_study_output',
                        'move_logo_to_main_pane',
                        'seconds_resolution',
                    ],
                    custom_resolutions: true,
                    favorites: { intervals },
                    custom_css_url: '/chart-custom.css',
                    client_id: 'livefxhub',
                    user_id: 'public',
                });

                widgetRef.current.onChartReady(() => {
                    if (!isMounted) return;
                    const w = widgetRef.current;
                    w.applyOverrides(overrides);
                    w.applyStudiesOverrides(studiesOverrides);

                    // ── Restore saved drawings/indicators via low-level load() ──
                    if (savedState) {
                        console.log('[ChartMain] Restoring saved chart state (drawings/indicators)...');
                        w.load(savedState);
                    }

                    // ── Sync timeframe to parent UI ──
                    if (savedResolution && setSelectedTimeframe) {
                        const tf = TIMEFRAMES.find(t => t.tv === savedResolution);
                        if (tf) setSelectedTimeframe(tf.label);
                    }

                    w.chart().onIntervalChanged().subscribe(null, (interval) => {
                        const tf = TIMEFRAMES.find(t => t.tv === interval);
                        if (tf && setSelectedTimeframe) setSelectedTimeframe(tf.label);
                    });

                    // ── Auto-save: persist chart state on user changes ──
                    w.subscribe('onAutoSaveNeeded', () => {
                        const token = localStorage.getItem('tradingAccessToken');
                        if (!token) return;
                        w.save((state) => {
                            const currentSym = w.chart().symbol() || sym;
                            const resolution = w.chart().resolution();
                            console.log('[ChartMain] Auto-saving chart for', currentSym, 'res:', resolution);
                            fetch(`${API_BASE}/${currentSym}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ resolution, content: JSON.stringify(state) })
                            }).catch(e => console.error('[ChartMain] Auto-save failed:', e));
                        });
                    });

                    setLoading(false);
                });
            } catch (err) {
                console.error('[ChartMain] init error:', err);
                if (isMounted) setError(err.message);
            }
        };

        init();
        return () => { isMounted = false; };
    }, [containerRef, theme, tradingMode]);

    // ── Symbol/Timeframe Updates (In-place) ──────────────────────
    useEffect(() => {
        if (!widgetRef.current) return;
        widgetRef.current.onChartReady(() => {
            const chart = widgetRef.current.chart();
            if (chart.symbol() !== selectedSymbol) {
                chart.setSymbol(selectedSymbol, () => { });
            }
            if (chart.resolution() !== activeTf) {
                chart.setResolution(activeTf, () => { });
            }
        });
    }, [selectedSymbol, activeTf]);

    return (
        <div className="chart-main">
            {/* TradingView Chart Container */}
            <div 
                key={`${theme}-${tradingMode}`} 
                className="chart-canvas-container" 
                style={{ position: 'relative', flex: 1, minHeight: 0 }}
            >
                {loading && (
                    <div className="chart-loading-overlay">
                        <div className="chart-loading-spinner" />
                        <span>Loading chart…</span>
                    </div>
                )}
                {error && (
                    <div className="chart-error-overlay">
                        <span>⚠ {error}</span>
                        <button onClick={() => window.location.reload()}>Retry</button>
                    </div>
                )}
                <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            </div>
        </div>
    );
}
