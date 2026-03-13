import React, { useState } from 'react';
import {
    LayoutDashboard, Users, Copy, CreditCard,
    Gift, Settings, HelpCircle, Calendar,
    ChevronDown, LogOut, Activity
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Sidebar({ sidebarOpen, activePage, setActivePage, copyTradingTab, setCopyTradingTab, walletTab, setWalletTab }) {
    const { t } = useTranslation();
    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu, e) => {
        e.preventDefault();
        setOpenMenu(prev => (prev === menu ? null : menu));
    };

    return (
        <div className="sidebar-container">
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <nav className="nav-menu">
                    <a href="#" className={`nav-item ${activePage === 'Dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('Dashboard'); }}>
                        <div className="nav-item-left">
                            <LayoutDashboard className="nav-icon" size={20} />
                            <span className="nav-text">{t('Dashboard')}</span>
                        </div>
                    </a>

                    <a href="#" className={`nav-item ${activePage === 'Accounts' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('Accounts'); }}>
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

                    <a href="#" className={`nav-item ${activePage === 'ReferAndEarn' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('ReferAndEarn'); }}>
                        <div className="nav-item-left">
                            <Gift className="nav-icon" size={20} />
                            <span className="nav-text">{t('Refer and earn')}</span>
                        </div>
                    </a>

                    <a href="#" className={`nav-item ${activePage === 'Settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('Settings'); }}>
                        <div className="nav-item-left">
                            <Settings className="nav-icon" size={20} />
                            <span className="nav-text">{t('Settings')}</span>
                        </div>
                    </a>

                    <a href="#" className={`nav-item ${activePage === 'Support' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('Support'); }}>
                        <div className="nav-item-left">
                            <HelpCircle className="nav-icon" size={20} />
                            <span className="nav-text">{t('Support')}</span>
                        </div>
                    </a>

                    <a href="#" className="nav-item">
                        <div className="nav-item-left">
                            <Calendar className="nav-icon" size={20} />
                            <span className="nav-text">{t('Calendar')}</span>
                        </div>
                    </a>
                </nav>

                <div className="sidebar-bottom">
                    <a href="#" className="nav-item logout-item" style={{ width: '100%', color: 'red' }}>
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
