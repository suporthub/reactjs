import { tradingConfigManager } from '../../utils/tradingConfigCache';

/**
 * LiveFXHub TradingView Datafeed — Production-Ready v2
 *
 * – History:  fetches OHLC from /candles REST API (protobuf)
 * – Live:     subscribes to tick updates via protobuf WebSocket
 * – Scroll:   infinite left-scroll triggers older history fetch
 * – Background: visibilitychange gap recovery on tab refocus
 * – Time:     all bar timestamps are UTC-aligned epoch seconds
 */

// ── Interval mappings ──────────────────────────────────────────
const TV_TO_API = {
    '1': '1m',
    '5': '5m',
    '15': '15m',
    '30': '30m',
    '60': '1h',
    '120': '2h',
    '240': '4h',
    '480': '8h',
    '1D': '1d',
    '1W': '1w',
    '1M': '1mo',
    '1S': '1s',
    '5S': '5s',
    '15S': '15s',
    '30S': '30s',
};

// TradingView resolution → seconds per bar
const RES_TO_SEC = {
    '1': 60, '5': 300, '15': 900, '30': 1800,
    '60': 3600, '120': 7200, '240': 14400, '480': 28800,
    '1D': 86400, '1W': 604800, '1M': 2592000,
    '1S': 1, '5S': 5, '15S': 15, '30S': 30,
};

// ── Helper: Derive PriceScale from Precision ──────────────────
function getPriceScale(precision) {
    if (precision === undefined || precision === null) return 100;
    return Math.pow(10, precision);
}

// ── Load protobufjs (CDN) — self-contained ────────────────────
let _protobufReady = null;

function ensureProtobuf() {
    if (_protobufReady) return _protobufReady;
    _protobufReady = new Promise((resolve, reject) => {
        if (window.protobuf) { resolve(); return; }
        const existing = document.getElementById('protobuf-js');
        if (existing) {
            if (window.protobuf) { resolve(); return; }
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('protobufjs load failed')));
            return;
        }
        const script = document.createElement('script');
        script.id = 'protobuf-js';
        script.src = 'https://cdn.jsdelivr.net/npm/protobufjs@7/dist/protobuf.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load protobufjs'));
        document.head.appendChild(script);
    });
    return _protobufReady;
}

// ── Proto schema (fetched once, cached) ────────────────────────
let _protoPromise = null;

function loadChartProto() {
    if (_protoPromise) return _protoPromise;
    _protoPromise = ensureProtobuf()
        .then(() => fetch('/chart.proto'))
        .then(r => r.text())
        .then(schema => {
            const root = window.protobuf.parse(schema).root;
            return root.lookupType('chartfeed.ChartResponse');
        });
    return _protoPromise;
}


// ── Robust int64 → Number conversion ──────────────────────────
function toNum(val) {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return Number(val);
    if (typeof val.toNumber === 'function') return val.toNumber();
    return Number(val);
}

// ── Align timestamp to bar boundary (UTC, in milliseconds) ────
function alignToBarMs(epochMs, barDurationSec) {
    const barDurationMs = barDurationSec * 1000;
    return epochMs - (epochMs % barDurationMs);
}

// ── Fetch candles from chart API ──────────────────────────────
const _inflightRequests = new Map();

async function fetchCandles(symbol, resolution, fromMs, toMs) {
    const cacheKey = `${symbol}|${resolution}|${fromMs}|${toMs}`;
    if (_inflightRequests.has(cacheKey)) {
        return _inflightRequests.get(cacheKey);
    }
    const promise = _fetchCandlesImpl(symbol, resolution, fromMs, toMs);
    _inflightRequests.set(cacheKey, promise);
    try {
        return await promise;
    } finally {
        _inflightRequests.delete(cacheKey);
    }
}

async function _fetchCandlesImpl(symbol, resolution, fromMs, toMs) {
    const ChartResponse = await loadChartProto();
    const apiInterval = TV_TO_API[resolution] || '1m';
    const from = new Date(fromMs).toISOString();
    const to = new Date(toMs).toISOString();
    const url = `/candles?symbol=${encodeURIComponent(symbol)}&interval=${apiInterval}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    console.log(`[Datafeed] fetch ${symbol} ${apiInterval} from=${from} to=${to}`);

    const res = await fetch(url, { headers: { 'Accept': 'application/x-protobuf' } });
    if (!res.ok) throw new Error(`chart API ${res.status}`);

    const buf = await res.arrayBuffer();
    const decoded = ChartResponse.decode(new Uint8Array(buf));
    const data = ChartResponse.toObject(decoded, { longs: Number });

    if (!data.candles || data.candles.length === 0) {
        console.log(`[Datafeed] ${symbol} ${apiInterval}: 0 candles returned`);
        return [];
    }
    const barDuration = RES_TO_SEC[resolution] || 60;
    const bars = data.candles.map(c => {
        const timeMs = toNum(c.timeUnixMs);

        // Enforce strict OHLC rules: High must be maximum, Low must be minimum
        const open = c.open;
        const close = c.close;
        const high = Math.max(open, close, c.high);
        const low = Math.min(open, close, c.low);

        return {
            time: alignToBarMs(timeMs, barDuration),
            open,
            high,
            low,
            close,
            volume: toNum(c.volume) || 0,
        };
    });

    console.log(`[Datafeed] ${symbol} ${apiInterval}: ${bars.length} candles, first=${new Date(bars[0].time).toISOString()}, last=${new Date(bars[bars.length - 1].time).toISOString()}`);
    return bars;
}

/**
 * WssManager — NOW A PASSIVE LISTENER
 * Instead of opening its own WebSocket, it listens for 'marketPriceUpdate'
 * events broadcasted by the MarketSidebar component.
 */
class WssManager {
    constructor() {
        this._subscribers = new Map();
        this._lastPrices = new Map();
        this._destroyed = false;

        this._setupEventListener();
    }

    _setupEventListener() {
        this._priceUpdateHandler = (e) => {
            if (this._destroyed || !e.detail) return;
            const { symbol, vals } = e.detail;
            if (!symbol || !Array.isArray(vals)) return;

            // Use the Ask price (index 1) for candles as requested
            const price = parseFloat(vals[1]);
            if (!isNaN(price)) {
                this._lastPrices.set(symbol, price);
                this._dispatchTick(symbol, price);
            }
        };
        window.addEventListener('marketPriceUpdate', this._priceUpdateHandler);
    }

    // ── Core: dispatch a price tick into OHLC candle logic ─────
    _dispatchTick(symbol, price) {
        const nowMs = Date.now();

        for (const [, sub] of this._subscribers) {
            if (sub.symbol !== symbol) continue;

            const barDuration = RES_TO_SEC[sub.resolution] || 60;
            const currentBarTimeMs = alignToBarMs(nowMs, barDuration);

            if (!sub.lastBar) {
                // No history yet — create initial bar
                sub.lastBar = {
                    time: currentBarTimeMs,
                    open: price, high: price, low: price, close: price,
                    volume: 1,
                };
                sub.handler({ ...sub.lastBar });
                continue;
            }

            if (currentBarTimeMs > sub.lastBar.time) {
                // ── NEW BAR: timeframe boundary crossed ──
                const newBar = {
                    time: currentBarTimeMs,
                    open: price,
                    high: price, low: price, close: price,
                    volume: 1,
                };
                sub.lastBar = newBar;
                sub.handler({ ...sub.lastBar });
            } else {
                // ── SAME BAR: update current candle ──
                // Strictly enforce OHLC rules on every tick update
                sub.lastBar.high = Math.max(sub.lastBar.open, sub.lastBar.high, price);
                sub.lastBar.low = Math.min(sub.lastBar.open, sub.lastBar.low, price);
                sub.lastBar.close = price;
                sub.lastBar.volume++;
                sub.handler({ ...sub.lastBar });
            }
        }
    }

    subscribe(listenerGuid, symbol, resolution, lastBar, handler, onResetCache) {
        this._subscribers.set(listenerGuid, {
            symbol, resolution,
            lastBar: lastBar ? { ...lastBar } : null,
            handler,
            onResetCache: onResetCache || null,
        });
        console.log(`[Datafeed] Subscribed to ${symbol} (via MarketSidebar)`);
    }

    unsubscribe(listenerGuid) {
        this._subscribers.delete(listenerGuid);
    }

    getLastPrice(symbol) {
        return this._lastPrices.get(symbol);
    }

    destroy() {
        this._destroyed = true;
        window.removeEventListener('marketPriceUpdate', this._priceUpdateHandler);
        this._subscribers.clear();
    }
}

// Singleton WSS instance (Passive)
let _wssManager = null;
function getWssManager() {
    if (!_wssManager) _wssManager = new WssManager();
    return _wssManager;
}

// ── TradingView Datafeed Factory ──────────────────────────────
export function createDatafeed() {
    const wss = getWssManager();

    // Shared state: capture lastBar from getBars for each symbol+resolution
    // so subscribeBars can use it directly (no separate fetch)
    const _lastBarMap = new Map(); // "SYMBOL|resolution" → lastBar

    return {
        onReady(callback) {
            setTimeout(() => callback({
                supported_resolutions: ['1S', '5S', '15S', '30S', '1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M'],
                supports_group_request: false,
                supports_marks: false,
                supports_search: true,
                supports_timescale_marks: false,
            }), 0);
        },

        async searchSymbols(userInput, exchange, symbolType, onResult) {
            const config = await tradingConfigManager.getConfig();
            const q = userInput.toUpperCase();
            const symbols = config?.symbols || [];

            const results = symbols
                .filter(s => s.symbol.toUpperCase().includes(q))
                .map(s => ({
                    symbol: s.symbol,
                    full_name: s.symbol,
                    description: s.symbol,
                    type: (s.instrumentType || 'forex').toLowerCase(),
                    exchange: 'LIVEFXHUB',
                    ticker: s.symbol,
                }));
            onResult(results);
        },

        async resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
            const sym = symbolName.toUpperCase();
            const config = await tradingConfigManager.getConfig();
            const symbolData = config?.symbols?.find(s => s.symbol.toUpperCase() === sym);

            // Robust Session Logic:
            // Forex/Commodities usually close Fri 22:00 - Sun 22:00 UTC.
            // TradingView session format: "2200-2200:23456" (Sun-Fri) or specific "1700-1600:234567"
            // For XAUUSD specifically: Sun 22:00 to Fri 24:00 (which is Sat 00:00)
            let session = '24x7';
            const type = (symbolData?.instrumentType || 'forex').toLowerCase();
            
            if (type === 'forex' || type === 'commodity' || sym.includes('XAU') || sym.includes('XAG')) {
                session = '24x5';
            }

            if (!symbolData) {
                console.warn(`[Datafeed] Symbol ${sym} not found in config, using generic info`);
                onSymbolResolvedCallback({
                    name: sym, ticker: sym, description: sym, type: 'forex',
                    session: session, timezone: 'Etc/UTC', exchange: 'LIVEFXHUB',
                    minmov: 1, pricescale: 100000, has_intraday: true, has_seconds: true,
                    seconds_multipliers: ['1', '5', '15', '30'], has_daily: true, has_weekly_and_monthly: true,
                    supported_resolutions: ['1S', '5S', '15S', '30S', '1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M'],
                    data_status: 'streaming',
                });
                return;
            }

            const pricescale = getPriceScale(symbolData.showPoints);

            setTimeout(() => onSymbolResolvedCallback({
                name: sym,
                ticker: sym,
                description: sym,
                type: type,
                session: session,
                timezone: 'Etc/UTC',
                exchange: 'LIVEFXHUB',
                minmov: 1,
                pricescale: pricescale,
                has_intraday: true,
                has_seconds: true,
                seconds_multipliers: ['1', '5', '15', '30'],
                has_daily: true,
                has_weekly_and_monthly: true,
                intraday_multipliers: ['1', '5', '15', '30', '60', '120', '240', '480'],
                supported_resolutions: ['1S', '5S', '15S', '30S', '1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M'],
                volume_precision: 0,
                data_status: 'streaming',
            }), 0);
        },

        async getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
            const { from, to, firstDataRequest, countBack } = periodParams;
            const symbol = symbolInfo.name;

            let fromMs = from * 1000;
            let toMs = to * 1000;
            if (firstDataRequest) toMs = Math.max(toMs, Date.now());

            console.log(`[Datafeed] getBars ${symbol} res=${resolution} from=${new Date(fromMs).toISOString()} to=${new Date(toMs).toISOString()} cb=${countBack}`);

            try {
                let allBars = [];
                let currentTo = toMs;
                let currentFrom = fromMs;
                let attempts = 0;
                const maxAttempts = 5;
                const targetCount = countBack || 300;

                // --- AGGRESSIVE MULTI-CHUNK FETCHING ---
                // We keep fetching older chunks until we have enough bars or hit the limit.
                // This "leaps" over weekends and holidays automatically.
                while (allBars.length < targetCount && attempts < maxAttempts) {
                    const bars = await fetchCandles(symbol, resolution, currentFrom, currentTo);
                    
                    if (bars.length > 0) {
                        // Merge and deduplicate
                        for (const b of bars) {
                            allBars.push(b);
                        }
                        const map = new Map();
                        allBars.forEach(b => map.set(b.time, b));
                        allBars = Array.from(map.values()).sort((a, b) => a.time - b.time);
                    }

                    if (allBars.length >= targetCount) break;

                    // If we found nothing or not enough, look back one "view" further
                    // Step size is based on resolution and target count to be efficient
                    const barDuration = RES_TO_SEC[resolution] || 60;
                    const stepSizeMs = Math.max(86400 * 1000, barDuration * targetCount * 1000);
                    
                    currentTo = currentFrom;
                    currentFrom -= stepSizeMs;
                    attempts++;
                    
                    console.log(`[Datafeed] ${symbol} chunk empty/short, searching older... attempt ${attempts}/${maxAttempts}`);
                }

                if (allBars.length === 0) {
                    console.log(`[Datafeed] ${symbol}: No data found after ${attempts} chunks.`);
                    onHistoryCallback([], { noData: true });
                    return;
                }

                // Final sort and slice
                allBars.sort((a, b) => a.time - b.time);
                let result = allBars;
                if (countBack && countBack > 0 && allBars.length > countBack) {
                    result = allBars.slice(allBars.length - countBack);
                }

                // Sync lastBar for realtime
                const lastBar = result[result.length - 1];
                const key = `${symbol}|${resolution}`;
                const existing = _lastBarMap.get(key);
                if (firstDataRequest || !existing || lastBar.time > existing.time) {
                    _lastBarMap.set(key, { ...lastBar });
                }

                onHistoryCallback(result, { noData: false });
            } catch (err) {
                console.error('[Datafeed] getBars error:', err);
                onErrorCallback(err.message);
            }
        },

        subscribeBars(symbolInfo, resolution, onRealtimeCallback, listenerGuid, onResetCacheNeededCallback) {
            const symbol = symbolInfo.name;
            const key = `${symbol}|${resolution}`;

            // Use the lastBar captured from getBars — this is what TradingView has
            // Using a different lastBar would cause TradingView to reject updates
            const lastBar = _lastBarMap.get(key) || null;

            console.log(`[Datafeed] subscribeBars ${symbol} res=${resolution} lastBar=${lastBar ? new Date(lastBar.time).toISOString() : 'null'}`);

            wss.subscribe(
                listenerGuid,
                symbol,
                resolution,
                lastBar,
                onRealtimeCallback,
                onResetCacheNeededCallback
            );
        },

        unsubscribeBars(listenerGuid) {
            wss.unsubscribe(listenerGuid);
        },
    };
}
