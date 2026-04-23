import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, Wallet, Gift, Copy, ChevronDown,
    Video, Circle, User, Settings, LogOut,
    ArrowLeft, Sun, Moon, Info, Zap, Trophy
} from 'lucide-react';
import { tradingConfigManager } from '../../utils/tradingConfigCache';
import { clearTradingSession } from './tradingTokenManager';

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

    const [tradingMode, setTradingMode] = useState('Normal');

    const toggleTradingMode = () => {
        const newMode = tradingMode === 'Normal' ? 'Advanced' : 'Normal';
        setTradingMode(newMode);
        // Dispatch event for other components to react to mode change
        window.dispatchEvent(new CustomEvent('tradingModeChanged', { detail: { mode: newMode } }));
    };

    useEffect(() => {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [isDark]);

    const handleLogout = () => {
        clearTradingSession();
        navigate('/dashboard');
    };

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
                <div className="terminal-mode-switcher" onClick={toggleTradingMode} title="Switch Trading Mode">
                    <div className={`mode-option ${tradingMode === 'Normal' ? 'active' : ''}`}>
                        <Zap size={12} />
                        <span>Normal</span>
                    </div>
                    <div className={`mode-option ${tradingMode === 'Advanced' ? 'active' : ''}`}>
                        <Trophy size={12} />
                        <span>Advanced</span>
                    </div>
                </div>

                <div className="terminal-account-selector" onClick={() => setAccountDropdown(!accountDropdown)}>
                    <span>Main Account</span>
                    <ChevronDown size={14} />
                </div>

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

                <button className="terminal-icon-btn terminal-logout-btn" title="Logout" onClick={handleLogout}>
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}
