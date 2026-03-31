import React, { useState } from 'react';
import {
    LayoutDashboard, Users, Copy, CreditCard,
    Gift, Settings, HelpCircle, Calendar,
    ChevronDown, LogOut, Activity, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getDeviceFingerprint } from '../utils/fingerprint';

export default function Sidebar({ sidebarOpen, setSidebarOpen, activePage, setActivePage, copyTradingTab, setCopyTradingTab, walletTab, setWalletTab }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu, e) => {
        e.preventDefault();
        setOpenMenu(prev => (prev === menu ? null : menu));
    };

    const handleNavClick = (page, e) => {
        e.preventDefault();

        // Dispatch global event if clicking Accounts to force a data refresh
        if (page === 'Accounts') {
            window.dispatchEvent(new Event('refreshAccountsData'));
        }

        setActivePage(page);
        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 768 && setSidebarOpen) {
            setSidebarOpen(false);
        }
    };

    const handleLogout = async (e) => {
        e.preventDefault();
        const portalToken = localStorage.getItem('portalToken');

        try {
            const fingerprint = await getDeviceFingerprint();
            await fetch('https://v3.livefxhub.com:8444/api/live/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${portalToken}`,
                    'X-Device-Fingerprint': fingerprint
                }
            });
        } catch (error) {
            console.warn('Logout API failed:', error);
        }

        // Clear All storage
        localStorage.clear();
        sessionStorage.clear();

        // Clear Cookies
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }

        // Redirect to login
        navigate('/login');
    };

    return (
        <div className={`sidebar-container ${sidebarOpen ? 'mobile-open' : ''}`}>
            {/* Dark backdrop for mobile */}
            {sidebarOpen && (
                <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>
            )}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Close button inside sidebar on mobile */}
                <div className="sidebar-mobile-header">
                    <div className="logo-text">Live <span style={{ color: 'var(--primary)' }}>Fx</span> Hub</div>
                    <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="nav-menu">
                    <a href="#" className={`nav-item ${activePage === 'Dashboard' ? 'active' : ''}`} onClick={(e) => handleNavClick('Dashboard', e)}>
                        <div className="nav-item-left">
                            <LayoutDashboard className="nav-icon" size={20} />
                            <span className="nav-text">{t('Dashboard')}</span>
                        </div>
                    </a>

                    <a href="#" className={`nav-item ${activePage === 'Accounts' ? 'active' : ''}`} onClick={(e) => handleNavClick('Accounts', e)}>
                        <div className="nav-item-left">
                            <Users className="nav-icon" size={20} />
                            <span className="nav-text">{t('Accounts')}</span>
                        </div>
                    </a>

                    <div className="nav-item-wrapper">
                        <a href="#" className={`nav-item ${activePage === 'CopyTrading' ? 'active' : ''}`} onClick={(e) => { toggleMenu('copyTrading', e); setActivePage('CopyTrading'); setCopyTradingTab('Discover'); }}>
                            <div className="nav-item-left">
                                <Copy className="nav-icon" size={20} />
                                <span className="nav-text">{t('Copy trading')}</span>
                            </div>
                            <ChevronDown className={`menu-chevron ${openMenu === 'copyTrading' ? 'open' : ''}`} size={16} />
                        </a>
                        <div className={`submenu ${openMenu === 'copyTrading' ? 'open' : ''}`}>
                            <a href="#" className={`submenu-item ${activePage === 'CopyTrading' && copyTradingTab === 'Discover' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('CopyTrading'); setCopyTradingTab('Discover'); }}><span className="nav-text">{t('Discover')}</span></a>
                            <a href="#" className={`submenu-item ${activePage === 'CopyTrading' && copyTradingTab === 'Assets' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('CopyTrading'); setCopyTradingTab('Assets'); }}><span className="nav-text">{t('Assets')}</span></a>
                            <a href="#" className={`submenu-item ${activePage === 'CopyTrading' && copyTradingTab === 'My strategies' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('CopyTrading'); setCopyTradingTab('My strategies'); }}><span className="nav-text">{t('My strategies')}</span></a>
                            <a href="#" className={`submenu-item ${activePage === 'CopyTrading' && copyTradingTab === 'Favorites' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('CopyTrading'); setCopyTradingTab('Favorites'); }}><span className="nav-text">{t('Favorites')}</span></a>
                        </div>
                    </div>

                    <a href="#" className="nav-item">
                        <div className="nav-item-left">
                            <Activity className="nav-icon" size={20} />
                            <span className="nav-text">{t('Algo trading')}</span>
                        </div>
                    </a>

                    <div className="nav-item-wrapper">
                        <a href="#" className={`nav-item ${activePage === 'Wallet' ? 'active' : ''}`} onClick={(e) => { toggleMenu('wallet', e); setActivePage('Wallet'); setWalletTab('Transactions'); }}>
                            <div className="nav-item-left">
                                <CreditCard className="nav-icon" size={20} />
                                <span className="nav-text">{t('Wallet and payments')}</span>
                            </div>
                            <ChevronDown className={`menu-chevron ${openMenu === 'wallet' ? 'open' : ''}`} size={16} />
                        </a>
                        <div className={`submenu ${openMenu === 'wallet' ? 'open' : ''}`}>
                            <a href="#" className={`submenu-item ${activePage === 'Wallet' && walletTab === 'Transactions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('Wallet'); setWalletTab('Transactions'); }}><span className="nav-text">{t('Transactions')}</span></a>
                            <a href="#" className={`submenu-item ${activePage === 'Wallet' && walletTab === 'Deposit' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('Wallet'); setWalletTab('Deposit'); }}><span className="nav-text">{t('Deposit')}</span></a>
                            <a href="#" className={`submenu-item ${activePage === 'Wallet' && walletTab === 'Withdraw' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('Wallet'); setWalletTab('Withdraw'); }}><span className="nav-text">{t('Withdraw')}</span></a>
                        </div>
                    </div>

                    <a href="#" className={`nav-item ${activePage === 'ReferAndEarn' ? 'active' : ''}`} onClick={(e) => handleNavClick('ReferAndEarn', e)}>
                        <div className="nav-item-left">
                            <Gift className="nav-icon" size={20} />
                            <span className="nav-text">{t('Refer and earn')}</span>
                        </div>
                    </a>

                    <a href="#" className={`nav-item ${activePage === 'Settings' ? 'active' : ''}`} onClick={(e) => handleNavClick('Settings', e)}>
                        <div className="nav-item-left">
                            <Settings className="nav-icon" size={20} />
                            <span className="nav-text">{t('Settings')}</span>
                        </div>
                    </a>

                    <a href="#" className={`nav-item ${activePage === 'Support' ? 'active' : ''}`} onClick={(e) => handleNavClick('Support', e)}>
                        <div className="nav-item-left">
                            <HelpCircle className="nav-icon" size={20} />
                            <span className="nav-text">{t('Support')}</span>
                        </div>
                    </a>

                    <a href="#" className={`nav-item ${activePage === 'Calendar' ? 'active' : ''}`} onClick={(e) => handleNavClick('Calendar', e)}>
                        <div className="nav-item-left">
                            <Calendar className="nav-icon" size={20} />
                            <span className="nav-text">{t('Calendar')}</span>
                        </div>
                    </a>

                    <a href="#" className={`nav-item ${activePage === 'IB' ? 'active' : ''}`} onClick={(e) => handleNavClick('IB', e)}>
                        <div className="nav-item-left">
                            <Activity className="nav-icon" size={20} />
                            <span className="nav-text">{localStorage.getItem('userData') && JSON.parse(localStorage.getItem('userData')).isIB ? t('IB Portal') : t('Become an IB')}</span>
                        </div>
                    </a>
                </nav>

                <div className="sidebar-bottom">
                    <a href="#" className="nav-item logout-item" style={{ width: '100%', color: 'red' }} onClick={handleLogout}>
                        <div className="nav-item-left">
                            <LogOut className="nav-icon" size={20} style={{ color: 'red' }} />
                            <span className="nav-text">{t('Logout')}</span>
                        </div>
                    </a>
                </div>
            </aside>
        </div>
    );
}
