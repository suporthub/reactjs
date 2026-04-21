import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, Wallet, Gift, Copy, ChevronDown,
    Video, Circle, User, Settings, LogOut,
    ArrowLeft, Sun, Moon, Info
} from 'lucide-react';
import { tradingConfigManager } from '../../utils/tradingConfigCache';

export default function TerminalTopbar() {
    const navigate = useNavigate();
    const [accountDropdown, setAccountDropdown] = useState(false);
    const [isDark, setIsDark] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme === 'dark';
        return document.documentElement.getAttribute('data-theme') === 'dark';
    });

    const toggleTheme = () => {
        const newIsDark = !isDark;
        const newTheme = newIsDark ? 'dark' : 'light';
        setIsDark(newIsDark);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const [leverage, setLeverage] = useState(null);

    useEffect(() => {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Fetch leverage from config
        const fetchConfig = async () => {
            const config = await tradingConfigManager.getConfig();
            if (config?.account?.leverage) {
                setLeverage(config.account.leverage);
            }
        };
        fetchConfig();

        // Listen for config updates (e.g. if version changes in background)
        const handleConfigUpdate = (e) => {
            if (e.detail?.account?.leverage) {
                setLeverage(e.detail.account.leverage);
            }
        };
        window.addEventListener('tradingConfigUpdated', handleConfigUpdate);
        return () => window.removeEventListener('tradingConfigUpdated', handleConfigUpdate);
    }, [isDark]);

    return (
        <header className="terminal-topbar">
            <div className="terminal-topbar-left">
                <div className="terminal-logo">
                    <span className="terminal-logo-text">
                        Live <span style={{ color: '#58a6ff' }}>Fx</span> Hub
                    </span>
                </div>
            </div>

            <div className="terminal-topbar-right">
                <div className="terminal-account-selector" onClick={() => setAccountDropdown(!accountDropdown)}>
                    <span>Main Account</span>
                    <ChevronDown size={14} />
                </div>

                {leverage && (
                    <div className="terminal-leverage-badge" title={`Account Leverage: 1:${leverage}`}>
                        <Info size={12} />
                        <span>1:{leverage}</span>
                    </div>
                )}

                <div className="terminal-live-badge live" title="Live account">
                    <Circle size={8} fill="#27ae60" color="#27ae60" />
                    <span>Live</span>
                </div>

                <button
                    className="terminal-icon-btn terminal-theme-btn"
                    onClick={toggleTheme}
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button className="terminal-icon-btn terminal-logout-btn" title="Logout" onClick={() => navigate('/login')}>
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}
