# LiveFXHub WebSocket Integration Documentation

This document explains the real-time market data integration for the Trading Terminal, covering both the **Market Sidebar** (Price List) and the **TradingView Chart** (Datafeed).

---

## 1. Connection & Authentication
The platform establishes a persistent connection to the LiveFXHub production streaming server.

- **Endpoint**: `wss://v3.livefxhub.com:8444/token={tradingAccessToken}`
- **Authentication**: The `tradingAccessToken` is retrieved from `localStorage` (stored during login) and passed directly in the URL path to authorize the session.

---

## 2. Market Sidebar Data Architecture
The sidebar uses a high-performance **MessagePack** binary protocol to handle thousands of price updates per second without UI lag.

### A. Dual-Format Parsing
The system is built to handle two distinct JSON/MessagePack payload structures:
1.  **Snapshot (Batch)**: Received upon initial subscription.
    - Format: `{ type: "snapshot", data: { "SYMBOL": [bid, ask, high, low, change] } }`
2.  **Tick Update (Individual)**: Received on every price movement.
    - Format: `{ s: "SYMBOL", p: [bid, ask, high, low, change] }`

### B. High-Performance Throttling (FPS Control)
To prevent the browser from freezing during high volatility, we implemented a **Ref-based buffering system**:
- **WebSocket Thread**: Inbound ticks are decoded and stored in a silent `updatesBufferRef` (Map-based).
- **Render Thread**: A `setInterval` runs at exactly **10 FPS (100ms)**. It flushes the buffer, merges partial updates, and commits a single batch update to React state. This ensures a consistent, smooth 60fps-like experience even under extreme market load.

### C. Real-Time Tick Logic
The UI provides instant visual feedback on market direction:
- **Direction Tracking**: The system maintains a `prevPricesRef`. Every new bid is compared to the previous bid.
- **Visual Feedback**:
    - **Blue (price-up)**: Triggered if the new price is higher than the previous tick.
    - **Red (price-down)**: Triggered if the new price is lower than the previous tick.
    - **Arrows**: Dynamic ▲/▼ indicators update based on the immediate tick direction.

### D. Connection Maintenance
- **Heartbeats**: The client listens for `{ type: "ping" }` frames from the server.
- **Keep-Alive**: It automatically responds with `{ action: "pong" }` every 30 seconds to prevent the connection from being terminated by load balancers.

---

## 3. TradingView Chart Datafeed
The chart uses a separate **Protobuf (Protocol Buffers)** implementation for history and real-time candle building.

### A. CORS & Schema Management
To resolve CORS (Cross-Origin Resource Sharing) blocks, the `.proto` schemas are **embedded directly** into `datafeed.js` as string constants:
- `CHART_PROTO`: Defines the OHLC historical candle structure.
- `PRICE_PROTO`: Defines the real-time server message structure.

---

## 4. Summary of Technologies Used
- **@msgpack/msgpack**: For lightning-fast binary decoding into JS objects.
- **Protobuf.js**: For structured data transfer on the charting layer.
- **React Hooks & Refs**: For decoupled state management between the network layer and the UI layer.

---

*Last Updated: April 2026*
