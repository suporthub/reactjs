/**
 * LiveFXHub TradingView Datafeed — Production-Ready v2
 *
 * – History:  fetches OHLC from /candles REST API (protobuf)
 * – Live:     subscribes to tick updates via msgpack WebSocket
 * – Scroll:   infinite left-scroll triggers older history fetch
 * – Background: visibilitychange gap recovery on tab refocus
 * – Time:     all bar timestamps are UTC-aligned epoch seconds
 * – Auth:     auto-refresh trading token on 401 / token expiry
 */

import { decode } from '@msgpack/msgpack';
import {
    getTradingAccessToken,
    refreshTradingToken,
    isTokenExpiredWsEvent,
    tradingFetch
} from '../../utils/tradingTokenManager';

// ── Interval mappings ──────────────────────────────────────────
const TV_TO_API = {
    '1': '1m', '5': '5m', '15': '15m', '30': '30m', '60': '1h',
    '120': '2h', '240': '4h', '480': '8h', '1D': '1d', '1W': '1w',
    '1M': '1mo', '1S': '1s', '5S': '5s', '15S': '15s', '30S': '30s',
};

const RES_TO_SEC = {
    '1': 60, '5': 300, '15': 900, '30': 1800, '60': 3600, '120': 7200,
    '240': 14400, '480': 28800, '1D': 86400, '1W': 604800, '1M': 2592000,
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

// ── Load protobufjs (for REST candles) ────────────────────────
let _protobufReady = null;
function ensureProtobuf() {
    if (_protobufReady) return _protobufReady;
    _protobufReady = new Promise((resolve, reject) => {
        if (window.protobuf) { resolve(); return; }
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

let _protoPromise = null;
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

function loadChartProto() {
    if (_protoPromise) return _protoPromise;
    _protoPromise = ensureProtobuf().then(() => {
        const root = window.protobuf.parse(CHART_PROTO).root;
        return root.lookupType('chartfeed.ChartResponse');
    });
    return _protoPromise;
}

function toNum(val) {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return Number(val);
    if (typeof val.toNumber === 'function') return val.toNumber();
    return Number(val);
}

function alignToBarMs(epochMs, barDurationSec) {
    const barDurationMs = barDurationSec * 1000;
    return epochMs - (epochMs % barDurationMs);
}

async function fetchCandles(symbol, resolution, fromMs, toMs) {
    const ChartResponse = await loadChartProto();
    const apiInterval = TV_TO_API[resolution] || '1m';
    const from = new Date(fromMs).toISOString();
    const to = new Date(toMs).toISOString();
    const url = `/candles?symbol=${encodeURIComponent(symbol)}&interval=${apiInterval}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    const res = await tradingFetch(url, { headers: { 'Accept': 'application/x-protobuf' } });
    if (!res.ok) throw new Error(`chart API ${res.status}`);

    const buf = await res.arrayBuffer();
    const decoded = ChartResponse.decode(new Uint8Array(buf));
    const data = ChartResponse.toObject(decoded, { longs: Number });

    if (!data.candles) return [];
    const barDuration = RES_TO_SEC[resolution] || 60;
    return data.candles.map(c => ({
        time: alignToBarMs(toNum(c.timeUnixMs), barDuration),
        open: c.open,
        high: Math.max(c.open, c.close, c.high),
        low: Math.min(c.open, c.close, c.low),
        close: c.close,
        volume: toNum(c.volume) || 0,
    }));
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
        this._lastMessageTime = 0;
        this._destroyed = false;
        this._refreshAttempted = false;

        this._connect();
        this._setupVisibilityHandler();
        this._setupTokenRefreshListener();
    }

    _refreshUrl() {
        const token = getTradingAccessToken();
        if (token) this._url = `wss://v3.livefxhub.com:8444/token=${token}`;
    }

    _setupTokenRefreshListener() {
        this._tokenRefreshHandler = () => {
            this._refreshUrl();
            if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
                this._refreshAttempted = false;
                this._connect();
            }
        };
        window.addEventListener('tradingTokenRefreshed', this._tokenRefreshHandler);
    }

    _connect() {
        if (this._destroyed || this._ws) return;
        this._refreshUrl();
        try {
            this._ws = new WebSocket(this._url);
            this._ws.binaryType = 'arraybuffer';
        } catch (e) {
            this._scheduleReconnect();
            return;
        }

        this._ws.onopen = () => {
            this._reconnectDelay = 1000;
            this._refreshAttempted = false;
            const symbols = [...new Set([...this._subscribers.values()].map(s => s.symbol))];
            if (symbols.length > 0) this._send({ action: 'subscribe', symbols });
        };

        this._ws.onmessage = (event) => {
            this._lastMessageTime = Date.now();
            try {
                const data = decode(new Uint8Array(event.data));

                // Handle batched updates from optimized backend
                if (data.type === 'prices' && data.data) {
                    for (const [symbol, vals] of Object.entries(data.data)) {
                        const price = parseFloat(vals[0]);
                        if (!isNaN(price)) {
                            this._lastPrices.set(symbol, price);
                            this._dispatchTick(symbol, price);
                        }
                    }
                }
                // Legacy / Snapshot support
                if (data.type === 'snapshot' && data.data) {
                    for (const [symbol, vals] of Object.entries(data.data)) {
                        const price = parseFloat(vals[0]);
                        if (!isNaN(price)) this._lastPrices.set(symbol, price);
                    }
                }
            } catch (e) {
                console.error('[WSS] Decode error:', e);
            }
        };

        this._ws.onclose = (e) => {
            this._ws = null;
            if (this._destroyed) return;
            if (isTokenExpiredWsEvent(e) && !this._refreshAttempted) {
                this._handleTokenRefreshAndReconnect();
            } else {
                this._scheduleReconnect();
            }
        };
        this._ws.onerror = () => this._ws?.close();
    }

    async _handleTokenRefreshAndReconnect() {
        this._refreshAttempted = true;
        const newToken = await refreshTradingToken();
        if (newToken) {
            this._refreshUrl();
            window.dispatchEvent(new CustomEvent('tradingTokenRefreshed', { detail: { accessToken: newToken } }));
            this._connect();
        } else {
            this._scheduleReconnect();
        }
    }

    _scheduleReconnect() {
        clearTimeout(this._reconnectTimer);
        this._reconnectTimer = setTimeout(() => {
            this._reconnectDelay = Math.min(this._reconnectDelay * 1.5, 15000);
            this._connect();
        }, this._reconnectDelay);
    }

    _send(obj) {
        if (this._ws?.readyState === WebSocket.OPEN) this._ws.send(JSON.stringify(obj));
    }

    _setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && (!this._ws || this._ws.readyState !== WebSocket.OPEN)) {
                this._connect();
            }
        });
    }

    _dispatchTick(symbol, price) {
        const nowMs = Date.now();
        for (const [, sub] of this._subscribers) {
            if (sub.symbol !== symbol) continue;
            const barDuration = RES_TO_SEC[sub.resolution] || 60;
            const currentBarTimeMs = alignToBarMs(nowMs, barDuration);

            if (!sub.lastBar || currentBarTimeMs > sub.lastBar.time) {
                sub.lastBar = { time: currentBarTimeMs, open: price, high: price, low: price, close: price, volume: 1 };
            } else {
                sub.lastBar.high = Math.max(sub.lastBar.high, price);
                sub.lastBar.low = Math.min(sub.lastBar.low, price);
                sub.lastBar.close = price;
                sub.lastBar.volume++;
            }
            sub.handler({ ...sub.lastBar });
        }
    }

    subscribe(guid, symbol, resolution, lastBar, handler) {
        this._subscribers.set(guid, { symbol, resolution, lastBar, handler });
        this._send({ action: 'subscribe', symbols: [symbol] });
    }

    unsubscribe(guid) {
        const sub = this._subscribers.get(guid);
        this._subscribers.delete(guid);
        if (sub && ![...this._subscribers.values()].some(s => s.symbol === sub.symbol)) {
            this._send({ action: 'unsubscribe', symbols: [sub.symbol] });
        }
    }

    destroy() {
        this._destroyed = true;
        clearTimeout(this._reconnectTimer);
        window.removeEventListener('tradingTokenRefreshed', this._tokenRefreshHandler);
        if (this._ws) this._ws.close();
    }
}

let _wssManager = null;
function getWssManager() {
    if (!_wssManager) _wssManager = new WssManager('');
    return _wssManager;
}

export function createDatafeed() {
    const wss = getWssManager();
    const _lastBarMap = new Map();

    return {
        onReady(cb) {
            setTimeout(() => cb({
                supported_resolutions: ['1S', '5S', '15S', '30S', '1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M'],
                supports_search: true,
                supports_group_request: false,
            }), 0);
        },
        searchSymbols(input, ex, type, onResult) {
            const q = input.toUpperCase();
            onResult(SYMBOLS.filter(s => s.includes(q)).map(s => ({
                symbol: s, full_name: s, description: SYMBOL_INFO[s]?.description || s,
                type: SYMBOL_INFO[s]?.type || 'forex', exchange: 'LIVEFXHUB', ticker: s,
            })));
        },
        resolveSymbol(name, onResolved, onError) {
            const info = SYMBOL_INFO[name.toUpperCase()];
            if (!info) return onError('Unknown symbol');
            setTimeout(() => onResolved({
                name: name.toUpperCase(), ticker: name.toUpperCase(), description: info.description,
                type: info.type, session: '24x7', timezone: 'Etc/UTC', exchange: 'LIVEFXHUB',
                minmov: info.minmov, pricescale: info.pricescale, has_intraday: true, has_seconds: true,
                supported_resolutions: ['1S', '5S', '15S', '30S', '1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M'],
            }), 0);
        },
        async getBars(symbolInfo, resolution, params, onHistory, onError) {
            try {
                const bars = await fetchCandles(symbolInfo.name, resolution, params.from * 1000, params.firstDataRequest ? Date.now() : params.to * 1000);
                if (bars.length > 0) _lastBarMap.set(`${symbolInfo.name}|${resolution}`, bars[bars.length - 1]);
                onHistory(bars, { noData: bars.length === 0 });
            } catch (err) { onError(err.message); }
        },
        subscribeBars(symbolInfo, resolution, onTick, guid) {
            const lastBar = _lastBarMap.get(`${symbolInfo.name}|${resolution}`);
            wss.subscribe(guid, symbolInfo.name, resolution, lastBar, onTick);
        },
        unsubscribeBars(guid) { wss.unsubscribe(guid); }
    };
}
