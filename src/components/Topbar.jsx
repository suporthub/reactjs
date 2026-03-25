import React, { useState, useRef, useEffect } from 'react';
import { Wallet, Sun, Moon, Globe, HelpCircle, Bell, Users, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'ar', label: 'العربية' },
    { code: 'ur', label: 'اردو' }
];

export default function Topbar({ theme, toggleTheme }) {
    const { t, i18n } = useTranslation();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const langMenuRef = useRef(null);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setShowLangMenu(false);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
                setShowLangMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="topbar">
            <div className="topbar-left">
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
                <button className="icon-button avatar" aria-label="Profile">
                    <Users size={18} />
                </button>
            </div>
        </header>
    );
}
