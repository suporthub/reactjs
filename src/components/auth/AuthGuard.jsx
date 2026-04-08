import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AuthGuard: Protects dashboard routes.
 * 
 * Flow:
 * 1. Check if portalToken exists in localStorage
 * 2. If no token → redirect to /login
 * 3. If token exists → validate it via /api/live/me
 * 4. If 401 → the apiInterceptor will auto-refresh using portalRefreshToken cookie
 * 5. If refresh also fails → interceptor redirects to /login
 * 6. If valid → render the protected content
 */

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

export default function AuthGuard({ children }) {
    const navigate = useNavigate();
    const [authState, setAuthState] = useState('checking'); // 'checking' | 'authenticated' | 'unauthenticated'
    const hasRun = React.useRef(false);

    useEffect(() => {
        // Prevent StrictMode double-call
        if (hasRun.current) return;
        hasRun.current = true;

        const validateAuth = async () => {
            let token = localStorage.getItem('portalToken');
            const refreshToken = getCookie('portalRefreshToken');

            // 1. If no access token but we have a refresh token, try to get a new access token
            if (!token && refreshToken) {
                try {
                    const refreshResponse = await fetch('https://v3.livefxhub.com:8444/api/live/refresh-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken })
                    });

                    const refreshData = await refreshResponse.json();

                    if (refreshData.success || refreshData.status === 'success') {
                        const data = refreshData.data || refreshData;
                        token = data.portalToken;
                        if (token) localStorage.setItem('portalToken', token);
                        
                        if (data.portalRefreshToken) {
                            const date = new Date();
                            date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
                            document.cookie = `portalRefreshToken=${data.portalRefreshToken}; expires=${date.toUTCString()}; path=/`;
                        }
                    } else {
                        throw new Error("Refresh failed");
                    }
                } catch (err) {
                    console.error('Manual refresh failed:', err);
                    clearAllAndGoToLogin();
                    return;
                }
            }

            // 2. If we still don't have a token, we must log in
            if (!token) {
                clearAllAndGoToLogin();
                return;
            }

            // 3. We have a token — validate it and get user profile
            try {
                const fingerprint = localStorage.getItem('deviceFingerprint') || '';
                const response = await fetch('https://v3.livefxhub.com:8444/api/live/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Device-Fingerprint': fingerprint
                    }
                });

                if (response.status === 401) {
                    // Try to redirect just in case interceptor failed or refresh was invalid
                    clearAllAndGoToLogin();
                    return;
                }

                const result = await response.json();

                if (result.success || result.status === 'success') {
                    localStorage.setItem('userData', JSON.stringify(result.data || result));
                    window.dispatchEvent(new Event('userDataUpdated'));
                    setAuthState('authenticated');
                } else {
                    clearAllAndGoToLogin();
                }
            } catch (err) {
                console.error('Auth validation failed:', err);
                // Safe default is to login again to prevent hung black screen
                clearAllAndGoToLogin();
            }
        };

        const clearAllAndGoToLogin = () => {
            localStorage.removeItem('portalToken');
            localStorage.removeItem('userData');
            document.cookie = 'portalRefreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            setAuthState('unauthenticated');
            navigate('/login', { replace: true });
        };

        validateAuth();
    }, [navigate]);

    // Show loading state while checking authentication
    if (authState === 'checking') {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                width: '100vw',
                background: '#0f1117',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(54, 135, 237, 0.2)',
                    borderTopColor: '#3687ED',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }}></div>
                <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>
                    Authenticating...
                </span>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // If unauthenticated, render nothing (redirect already triggered)
    if (authState === 'unauthenticated') {
        return null;
    }

    // Authenticated — render the protected content
    return children;
}
