import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, Wallet, Gift, Copy, ChevronDown,
    Video, Circle, User, Settings, LogOut,
    ArrowLeft, Sun, Moon
} from 'lucide-react';

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

    useEffect(() => {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
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
