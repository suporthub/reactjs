# ── Build Stage ──
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

COPY . .
# Copy TradingView charting library into public so Vite includes it in dist
RUN mkdir -p public/trading-view && \
    cp -r trading-view/charting_library public/trading-view/charting_library
RUN npm run build

# ── Runtime Stage ──
# Serve with a lightweight static file server built into nginx
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config — SPA routing + gzip
RUN printf 'server {\n\
    listen 3000;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    gzip on;\n\
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;\n\
    gzip_min_length 256;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location ~* \\.(js|css|png|jpg|jpeg|svg|ico|woff2|woff|ttf|wasm)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://localhost:3000 || exit 1
