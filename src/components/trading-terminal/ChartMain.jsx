import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { createDatafeed } from './datafeed';

// ── Symbols and timeframes ────────────────────────────────────
export const CHART_SYMBOLS = ['XAUUSD', 'XAGUSD', 'BTCUSD', 'AUDCAD', 'AUDJPY', 'JPN225'];

const TIMEFRAMES = [
    { label: '1s',  tv: '1S'  },
    { label: '5s',  tv: '5S'  },
    { label: '15s', tv: '15S' },
    { label: '30s', tv: '30S' },
    { label: '1m',  tv: '1'   },
    { label: '5m',  tv: '5'   },
    { label: '15m', tv: '15'  },
    { label: '30m', tv: '30'  },
    { label: '1H',  tv: '60'  },
    { label: '2H',  tv: '120' },
    { label: '4H',  tv: '240' },
    { label: '8H',  tv: '480' },
    { label: '1D',  tv: '1D'  },
    { label: '1W',  tv: '1W'  },
    { label: '1M',  tv: '1M'  },
];

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
    const widgetRef    = useRef(null);
    const [utcTime, setUtcTime] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    // Singleton datafeed — preserves WSS connection across widget rebuilds
    const datafeed = useMemo(() => createDatafeed(), []);

    // Active TradingView resolution (maps from label → TV format)
    const activeTf = TIMEFRAMES.find(t => t.label === selectedTimeframe)?.tv || '30';

    // ── Clock ──────────────────────────────────────────────────
    useEffect(() => {
        const tick = () => {
            setUtcTime(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    // ── Build / rebuild widget when symbol or timeframe changes ─
    const buildWidget = useCallback(async () => {
        if (!containerRef.current) return;
        setLoading(true);
        setError(null);

        try {
            await loadTradingViewScript();

            // Destroy previous widget
            if (widgetRef.current) {
                try { widgetRef.current.remove(); } catch (_) {}
                widgetRef.current = null;
            }

            widgetRef.current = new window.TradingView.widget({
                // Container
                container: containerRef.current,
                library_path: '/trading-view/charting_library/',
                locale: 'en',

                // Symbol & interval
                symbol:    selectedSymbol || 'XAUUSD',
                interval:  activeTf,

                // Datafeed
                datafeed: datafeed,

                // Style
                theme: 'Dark',
                style: '1',   // candlestick
                toolbar_bg: '#0d1117',
                overrides: {
                    'mainSeriesProperties.candleStyle.upColor':        '#3687ED',
                    'mainSeriesProperties.candleStyle.downColor':      '#DA5244',
                    'mainSeriesProperties.candleStyle.wickUpColor':    '#3687ED',
                    'mainSeriesProperties.candleStyle.wickDownColor':  '#DA5244',
                    'mainSeriesProperties.candleStyle.borderUpColor':  '#3687ED',
                    'mainSeriesProperties.candleStyle.borderDownColor':'#DA5244',
                    'paneProperties.background':                       '#0d1117',
                    'paneProperties.backgroundType':                   'solid',
                    'scalesProperties.textColor':                      '#8b949e',
                    'scalesProperties.lineColor':                      '#21262d',
                    'paneProperties.vertGridProperties.color':         '#21262d',
                    'paneProperties.horzGridProperties.color':         '#21262d',
                },

                // UI features
                fullscreen: false,
                autosize:   true,
                disabled_features: [
                    'header_symbol_search',   // we handle symbol from sidebar
                    'header_compare',
                    'display_market_status',
                    'header_screenshot',
                    'go_to_date',
                ],
                enabled_features: [
                    'side_toolbar_in_fullscreen_mode',
                    'header_fullscreen_button',
                    'hide_last_na_study_output',
                    'move_logo_to_main_pane',
                    'seconds_resolution',              // Enable native seconds dropdown support
                    'use_localstorage_for_settings',   // persist user layout per device
                    'save_chart_properties_to_local_storage',
                ],

                // Defines the intervals in the top resolution dropdown
                custom_resolutions: true,
                favorites: {
                    intervals: ['1S','5S','15S','30S','1','5','15','30','60','120','240','480','1D','1W','1M'],
                },

                // Saved layouts per user session (localStorage key includes symbol)
                charts_storage_url: undefined,
                client_id:   'livefxhub',
                user_id:     'public',
                load_last_chart: true,
            });

            widgetRef.current.onChartReady(() => {
                setLoading(false);
            });

        } catch (err) {
            console.error('[ChartMain] widget error:', err);
            setError(err.message);
            setLoading(false);
        }
    }, [selectedSymbol, activeTf]);

    useEffect(() => {
        buildWidget();
        return () => {
            if (widgetRef.current) {
                try { widgetRef.current.remove(); } catch (_) {}
                widgetRef.current = null;
            }
        };
    }, [buildWidget]);

    // ── Timeframe change — update chart without full rebuild ───
    const handleTimeframeChange = useCallback((tf) => {
        setSelectedTimeframe(tf.label);
        if (widgetRef.current && widgetRef.current.chart) {
            try {
                widgetRef.current.chart().setResolution(tf.tv, () => {});
            } catch (_) {
                // If chart not ready yet, the buildWidget effect will handle it
            }
        }
    }, [setSelectedTimeframe]);

    return (
        <div className="chart-main">
            {/* Removed custom Timeframe Toolbar — relying on native TradingView header dropdown */}            {/* Symbol Tab Strip */}
            <div className="chart-symbol-tabs">
                {CHART_SYMBOLS.map(sym => (
                    <button
                        key={sym}
                        className={`chart-symbol-tab ${selectedSymbol === sym ? 'active' : ''}`}
                        onClick={() => {
                            // Propagate to parent state + update chart in-place
                            if (onSelectSymbol) onSelectSymbol(sym);
                            if (widgetRef.current?.chart) {
                                try {
                                    widgetRef.current.chart().setSymbol(sym, () => {});
                                } catch (_) {}
                            }
                        }}
                    >
                        {sym}
                    </button>
                ))}
            </div>

            {/* TradingView Chart Container */}
            <div className="chart-canvas-container" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                {loading && (
                    <div className="chart-loading-overlay">
                        <div className="chart-loading-spinner" />
                        <span>Loading chart…</span>
                    </div>
                )}
                {error && (
                    <div className="chart-error-overlay">
                        <span>⚠ {error}</span>
                        <button onClick={buildWidget}>Retry</button>
                    </div>
                )}
                {/* TradingView mounts into this div */}
                <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            </div>
        </div>
    );
}
