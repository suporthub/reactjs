import React, { useState, useRef, useEffect } from 'react';
import { Wallet, Sun, Moon, Globe, HelpCircle, Bell, Users, ChevronDown, Check, User, Mail, ShieldCheck, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Topbar.css'; // Assuming Topbar.css will contain styles for the new profile menu

const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'ar', label: 'العربية' },
    { code: 'ur', label: 'اردو' }
];

export default function Topbar({ theme, toggleTheme, sidebarOpen, setSidebarOpen }) {
    const { t, i18n } = useTranslation();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const langMenuRef = useRef(null);
    const profileMenuRef = useRef(null);

    const userDataStr = localStorage.getItem('userData');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const displayName = userData ? (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : 'Trader') : 'Trader';

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setShowLangMenu(false);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
                setShowLangMenu(false);
            }
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const kycStatusColor = () => {
        switch(userData?.kycStatus?.toLowerCase()) {
            case 'verified': return '#10b981';
            case 'pending': return '#f59e0b';
            case 'rejected': return '#ef4444';
            default: return '#64748b';
        }
    };

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle Sidebar">
                    <Menu size={22} />
                </button>
                <div className="logo-wrapper">
                    <div className="logo-text">Live <span style={{ color: 'var(--primary)' }}>Fx</span> Hub</div>
                </div>
            </div>

            <div className="topbar-right">
                <div className="balance-box">
                    <Wallet size={18} color="var(--text-muted)" />
                    <span className="balance-val">0.00</span>
                    <span>USD</span>
                </div>

                <button className="icon-button no-border" onClick={toggleTheme} aria-label="Toggle Theme">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                
                <div className="lang-selector-container" ref={langMenuRef}>
                    <button 
                        className={`icon-button no-border ${showLangMenu ? 'active' : ''}`} 
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        aria-label="Language"
                    >
                        <Globe size={20} />
                    </button>
                    {showLangMenu && (
                        <div className="lang-dropdown-menu">
                            {languages.map((lng) => (
                                <div 
                                    key={lng.code} 
                                    className={`lang-dropdown-option ${i18n.language === lng.code ? 'active' : ''}`}
                                    onClick={() => changeLanguage(lng.code)}
                                >
                                    <span>{lng.label}</span>
                                    {i18n.language === lng.code && <Check size={14} />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button className="icon-button no-border" aria-label="Help">
                    <HelpCircle size={20} />
                </button>
                <button className="icon-button no-border notification-icon" aria-label="Notifications">
                    <Bell size={20} />
                    <div className="notification-dot"></div>
                </button>

                <div className="profile-selector-container" ref={profileMenuRef}>
                    <button 
                        className={`icon-button avatar ${showProfileMenu ? 'active' : ''}`} 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        aria-label="Profile"
                    >
                        <Users size={18} />
                    </button>
                    {showProfileMenu && userData && (
                        <div className="profile-dropdown-menu">
                            <div className="profile-header">
                                <div className="profile-avatar-large" style={{ background: 'transparent', padding: 0 }}>
                                    <User size={22} color="var(--primary)" />
                                </div>
                                <div className="profile-info-text">
                                    <div className="profile-name">{displayName}</div>
                                    <div className="profile-email">
                                        <Mail size={12} />
                                        {userData.email}
                                    </div>
                                </div>
                            </div>
                            <div className="profile-divider"></div>
                            <div className="profile-status-item">
                                <div className="status-label">
                                    <ShieldCheck size={16} />
                                    KYC Status
                                </div>
                                <div className="status-value" style={{ color: kycStatusColor() }}>
                                    {userData.kycStatus || 'Not Started'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
