// Intercepts all fetch requests to handle 401 Unauthorized responses
// and silently refresh the JWT token before retrying the original request.

const originalFetch = window.fetch;

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};
const setCookie = (name, value, days) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict; Secure";
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('portalToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('accounts');
  // Clear portalRefreshToken cookie securely
  document.cookie = 'portalRefreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure';
  // Only redirect if not already on login/signup
  if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
    window.location.href = '/login';
  }
};

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const isAuthEndpoint = (url) => {
  if (typeof url !== 'string') return false;
  // Skip paths that are either public or handled by the dedicated trading token manager
  const skipPaths = [
    '/login', '/signup', '/refresh-token', '/forgot',
    '/verify', '/reset', '/otp',
    '/trading-config', '/order/place', '/order/close'
  ];
  return skipPaths.some(path => url.includes(path));
};

window.fetch = async (...args) => {
  const [resource, config] = args;

  // Skip interception for non-authenticated endpoints
  if (isAuthEndpoint(resource)) {
    return originalFetch(...args);
  }

  let response = await originalFetch(...args);

  if (response.status === 401) {
    const refreshToken = getCookie('portalRefreshToken');

    if (!refreshToken) {
      // No refresh token available — session fully expired
      clearAuthAndRedirect();
      return response;
    }

    // Subscribing immediately guarantees NO fetch hangs forever
    const retryPromise = new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        if (newToken) {
          const newConfig = { ...(config || {}) };

          let headersObj = {};
          if (newConfig.headers instanceof Headers) {
            newConfig.headers.forEach((value, key) => { headersObj[key] = value; });
          } else if (newConfig.headers) {
            headersObj = { ...newConfig.headers };
          }

          Object.keys(headersObj).forEach(key => {
            if (key.toLowerCase() === 'authorization') {
              delete headersObj[key];
            }
          });

          headersObj['Authorization'] = `Bearer ${newToken}`;
          newConfig.headers = headersObj;

          resolve(originalFetch(resource, newConfig));
        } else {
          // Refresh failed — redirect to login
          clearAuthAndRedirect();
          resolve(response);
        }
      });
    });

    if (!isRefreshing) {
      isRefreshing = true;

      // Kick off the refresh async WITHOUT pausing the interceptor
      (async () => {
        try {
          const refreshResponse = await originalFetch('https://v3.livefxhub.com:8444/api/live/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken }),
            credentials: 'include'
          });

          if (!refreshResponse.ok) {
            isRefreshing = false;
            onRefreshed(null);
            return;
          }

          const refreshData = await refreshResponse.json();

          if (refreshData.success || refreshData.status === 'success') {
            const data = refreshData.data || refreshData;

            if (data.portalToken) {
              localStorage.setItem('portalToken', data.portalToken);
            }
            if (data.portalRefreshToken) {
              setCookie('portalRefreshToken', data.portalRefreshToken, 7);
            }

            isRefreshing = false;
            onRefreshed(data.portalToken);
          } else {
            // Refresh token expired or invalid
            isRefreshing = false;
            onRefreshed(null);
          }
        } catch (err) {
          console.error("Token refresh failed:", err);
          isRefreshing = false;
          onRefreshed(null);
        }
      })();
    }

    return retryPromise;
  }

  return response;
};