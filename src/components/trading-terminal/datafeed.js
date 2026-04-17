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

// ── Supported symbols ──────────────────────────────────────────
const SYMBOLS = ['XAUUSD', 'XAGUSD', 'BTCUSD', 'AUDCAD', 'AUDJPY', 'JPN225'];

const SYMBOL_INFO = {
    XAUUSD: { description: 'Gold vs US Dollar', type: 'forex', pricescale: 100, minmov: 1 },
    XAGUSD: { description: 'Silver vs US Dollar', type: 'forex', pricescale: 1000, minmov: 1 },
    BTCUSD: { description: 'Bitcoin vs US Dollar', type: 'crypto', pricescale: 100, minmov: 1 },
    AUDCAD: { description: 'Australian Dollar/CAD', type: 'forex', pricescale: 100000, minmov: 1 },
    AUDJPY: { description: 'Australian Dollar/JPY', type: 'forex', pricescale: 1000, minmov: 1 },
    JPN225: { description: 'Nikkei 225', type: 'index', pricescale: 100, minmov: 1 },
};

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
let _wssProtoPromise = null;

const CHART_PROTO = `
syntax = "proto3";
package chartfeed;
message Candle {
  int64 timeUnixMs = 1;
  double open = 2;
  double high = 3;
  double low = 4;
  double close = 5;
  double volume = 6;
}
message ChartResponse {
  repeated Candle candles = 1;
}
`;

const PRICE_PROTO = `
syntax = "proto3";
package pricefeed;
message PriceUpdate {
  string symbol = 1;
  string buy = 2;
  string sell = 3;
}
message ServerMessage {
  string type = 1;
  repeated PriceUpdate updates = 2;
}
`;

function loadChartProto() {
    if (_protoPromise) return _protoPromise;
    _protoPromise = ensureProtobuf()
        .then(() => {
            const root = window.protobuf.parse(CHART_PROTO).root;
            return root.lookupType('chartfeed.ChartResponse');
        });
    return _protoPromise;
}

function loadWssProto() {
    if (_wssProtoPromise) return _wssProtoPromise;
    _wssProtoPromise = ensureProtobuf()
        .then(() => {
            const root = window.protobuf.parse(PRICE_PROTO).root;
            return root.lookupType('pricefeed.ServerMessage');
        });
    return _wssProtoPromise;
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

// ── Live WSS Manager (singleton) ──────────────────────────────
class WssManager {
    constructor(url) {
        this._url = url;
        this._ws = null;
        this._subscribers = new Map();
        this._reconnectTimer = null;
        this._reconnectDelay = 1000;
        this._lastPrices = new Map();
        this._wasHidden = false;
        this._lastMessageTime = 0;
        this._pingTimer = null;
        this._destroyed = false;

        this._connect();
        this._setupVisibilityHandler();
        this._setupPingTimer();
    }

    _connect() {
        if (this._destroyed || this._ws) return;
        try {
            this._ws = new WebSocket(this._url);
            this._ws.binaryType = 'arraybuffer';
        } catch (e) {
            console.error('[WSS] Connection failed:', e);
            this._scheduleReconnect();
            return;
        }

        this._ws.onopen = () => {
            console.log('[WSS] connected');
            this._reconnectDelay = 1000;
            clearTimeout(this._reconnectTimer);
            const symbols = [...new Set([...this._subscribers.values()].map(s => s.symbol))];
            if (symbols.length > 0) {
                this._send({ action: 'subscribe', symbols });
            }
        };

        this._ws.onmessage = async (event) => {
            this._lastMessageTime = Date.now();
            try {
                const ServerMessage = await loadWssProto();
                const msg = ServerMessage.decode(new Uint8Array(event.data));
                const data = ServerMessage.toObject(msg, { longs: Number });

                if (data.type === 'prices' && data.updates) {
                    for (const update of data.updates) {
                        if (!update.symbol || !update.buy) continue;
                        const price = parseFloat(update.buy);
                        if (isNaN(price)) continue;
                        this._lastPrices.set(update.symbol, price);
                        this._dispatchTick(update.symbol, price);
                    }
                }
            } catch (e) {
                console.error('[WSS] Decode error:', e);
            }
        };

        this._ws.onclose = () => {
            console.log('[WSS] disconnected');
            this._ws = null;
            if (!this._destroyed) this._scheduleReconnect();
        };

        this._ws.onerror = () => {
            this._ws?.close();
        };
    }

    _scheduleReconnect() {
        clearTimeout(this._reconnectTimer);
        const delay = Math.min(this._reconnectDelay, 15000);
        this._reconnectTimer = setTimeout(() => {
            this._reconnectDelay = Math.min(this._reconnectDelay * 1.5, 15000);
            this._connect();
        }, delay);
    }

    _send(obj) {
        if (this._ws?.readyState === WebSocket.OPEN) {
            this._ws.send(JSON.stringify(obj));
        }
    }

    _setupPingTimer() {
        this._pingTimer = setInterval(() => {
            if (Date.now() - this._lastMessageTime > 35000) {
                this._send({ action: 'ping' });
            }
        }, 10000);
    }

    _setupVisibilityHandler() {
        this._visibilityHandler = () => {
            if (document.hidden) {
                this._wasHidden = true;
                this._hiddenAt = Date.now();
            } else if (this._wasHidden) {
                this._wasHidden = false;
                const hiddenDuration = Date.now() - (this._hiddenAt || 0);
                console.log(`[WSS] Tab returned after ${Math.round(hiddenDuration / 1000)}s`);
                if (hiddenDuration > 5000) this._recoverGap();
            }
        };
        document.addEventListener('visibilitychange', this._visibilityHandler);
    }

    async _recoverGap() {
        console.log('[WSS] Recovering gap after background tab...');
        for (const [, sub] of this._subscribers) {
            if (sub.onResetCache) {
                sub.onResetCache();
            }
        }
        if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
            this._connect();
        }
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
        this._send({ action: 'subscribe', symbols: [symbol] });
        console.log(`[WSS] subscribed ${symbol} res=${resolution} lastBar=${lastBar ? new Date(lastBar.time).toISOString() : 'null'}`);
    }

    unsubscribe(listenerGuid) {
        const sub = this._subscribers.get(listenerGuid);
        this._subscribers.delete(listenerGuid);
        if (!sub) return;
        const stillNeeded = [...this._subscribers.values()].some(s => s.symbol === sub.symbol);
        if (!stillNeeded) {
            this._send({ action: 'unsubscribe', symbols: [sub.symbol] });
        }
    }

    getLastPrice(symbol) {
        return this._lastPrices.get(symbol);
    }

    destroy() {
        this._destroyed = true;
        clearTimeout(this._reconnectTimer);
        clearInterval(this._pingTimer);
        document.removeEventListener('visibilitychange', this._visibilityHandler);
        if (this._ws) {
            this._ws.onclose = null;
            this._ws.close();
            this._ws = null;
        }
        this._subscribers.clear();
    }
}

// Singleton WSS instance
function getWssManager() {
    const token = localStorage.getItem('tradingAccessToken');
    const WSS_URL = `wss://v3.livefxhub.com:8444/token=${token}`;
    if (!window._wssManager) window._wssManager = new WssManager(WSS_URL);
    return window._wssManager;
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

        searchSymbols(userInput, exchange, symbolType, onResult) {
            const q = userInput.toUpperCase();
            const results = SYMBOLS
                .filter(s => s.includes(q))
                .map(s => ({
                    symbol: s,
                    full_name: s,
                    description: SYMBOL_INFO[s]?.description || s,
                    type: SYMBOL_INFO[s]?.type || 'forex',
                    exchange: 'LIVEFXHUB',
                    ticker: s,
                }));
            onResult(results);
        },

        resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
            const sym = symbolName.toUpperCase();
            const info = SYMBOL_INFO[sym];
            if (!info) {
                onResolveErrorCallback(`Unknown symbol: ${sym}`);
                return;
            }
            setTimeout(() => onSymbolResolvedCallback({
                name: sym,
                ticker: sym,
                description: info.description,
                type: info.type,
                session: '24x7',
                timezone: 'Etc/UTC',
                exchange: 'LIVEFXHUB',
                minmov: info.minmov,
                pricescale: info.pricescale,
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

            // TradingView passes from/to as UTC seconds
            let fromMs = from * 1000;
            let toMs = firstDataRequest ? Date.now() : to * 1000;

            console.log(`[Datafeed] getBars ${symbol} res=${resolution} from=${new Date(fromMs).toISOString()} to=${new Date(toMs).toISOString()} first=${firstDataRequest} countBack=${countBack}`);

            try {
                let bars = await fetchCandles(symbol, resolution, fromMs, toMs);

                // If firstDataRequest returned no data, try fetching a wider range
                // to find the nearest available data
                if (bars.length === 0 && firstDataRequest) {
                    const barDuration = RES_TO_SEC[resolution] || 60;
                    // Try up to 24 hours back
                    const widerFrom = Date.now() - (86400 * 1000);
                    console.log(`[Datafeed] No data in range, trying wider: from=${new Date(widerFrom).toISOString()}`);
                    bars = await fetchCandles(symbol, resolution, widerFrom, Date.now());
                }

                if (bars.length === 0) {
                    console.log(`[Datafeed] ${symbol}: noData=true`);
                    onHistoryCallback([], { noData: true });
                    return;
                }

                // Deduplicate by time
                const seen = new Set();
                const uniqueBars = [];
                for (const bar of bars) {
                    if (!seen.has(bar.time)) {
                        seen.add(bar.time);
                        uniqueBars.push(bar);
                    }
                }

                // Sort ascending
                uniqueBars.sort((a, b) => a.time - b.time);

                // If countBack is provided, return only the last N bars
                let result = uniqueBars;
                if (countBack && countBack > 0 && uniqueBars.length > countBack) {
                    result = uniqueBars.slice(uniqueBars.length - countBack);
                }

                // Store the last bar for subscribeBars to use
                const lastBar = result[result.length - 1];
                const key = `${symbol}|${resolution}`;

                // ONLY update if it's the first data request (most recent data),
                // OR if the new lastBar is newer than what we already have.
                const existing = _lastBarMap.get(key);
                if (firstDataRequest || !existing || lastBar.time > existing.time) {
                    _lastBarMap.set(key, { ...lastBar });
                }

                console.log(`[Datafeed] ${symbol} res=${resolution}: returning ${result.length} bars, lastBar time=${new Date(lastBar.time).toISOString()} close=${lastBar.close}`);

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
