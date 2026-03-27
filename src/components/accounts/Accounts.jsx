import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './accounts.css';
import {
    Plus, ChevronDown, LayoutGrid, List, ArrowDownToLine,
    ArrowUpToLine, MoreVertical, Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Accounts() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Live'); // Changed 'Real' to 'Live'
    const [viewMode, setViewMode] = useState('list');
    const [accounts, setAccounts] = useState([]);

    const hasFetched = React.useRef(false);

    // Fetch accounts from API
    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchAccounts = async () => {
            const token = localStorage.getItem('portalToken');
            const fingerprint = localStorage.getItem('deviceFingerprint');
            
            if (!token) return;

            try {
                const response = await fetch('https://v3.livefxhub.com:8444/api/live/accounts', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Device-Fingerprint': fingerprint
                    }
                });
                const result = await response.json();
                if (result.success) {
                    setAccounts(result.data || []);
                    localStorage.setItem('accounts', JSON.stringify(result.data || []));
                }
            } catch (error) {
                console.error("Fetch accounts failed:", error);
            }
        };

        fetchAccounts();
    }, []);

    // Filter accounts based on activeTab
    const filteredAccounts = accounts.filter(acc => 
        acc.type === activeTab.toLowerCase()
    );

    return (
        <main className="main-content">
            <div className="content-area">
                {/* Banner */}
                <div className="partner-banner">
                    <div className="banner-content">
                        <h2>{t('Become a partner')}</h2>
                        <p>{t('Invite partner desc')}</p>
                    </div>
                    <div className="banner-shapes">
                        <div className="shape-circle shape-1"></div>
                        <div className="shape-circle shape-2"></div>
                        <div className="shape-circle shape-3"></div>
                    </div>
                </div>

                {/* Section Options */}
                <div className="section-header">
                    <h1>{t('My accounts')}</h1>
                    <button className="btn-primary">
                        <Plus size={18} />
                        {t('Open account')}
                    </button>
                </div>

                {/* Controls Bar (Tabs & Filters) */}
                <div className="controls-bar">
                    <div className="tabs-container">
                        <div className="tabs">
                            <button
                                className={`tab-button ${activeTab === 'Live' ? 'active' : ''}`}
                                onClick={() => setActiveTab('Live')}
                            >
                                {t('Live')}
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'Demo' ? 'active' : ''}`}
                                onClick={() => setActiveTab('Demo')}
                            >
                                {t('Demo')}
                            </button>
                        </div>
                    </div>

                    <div className="filters">
                        <button className="filter-dropdown">
                            <ArrowDownToLine size={16} />
                            {t('Newest')}
                            <ChevronDown size={14} />
                        </button>
                        <div className="view-toggles">
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                            >
                                <List size={18} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dynamic Account Cards */}
                <div className={`accounts-list-container ${viewMode}`}>
                    {filteredAccounts.length > 0 ? (
                        filteredAccounts.map((acc, index) => (
                            <div key={acc.accountNumber || index} className="account-card">
                                <div className="account-header">
                                    <div className="account-tags">
                                        <span className="tag">Live Fx Hub</span>
                                        <span className="tag">{acc.groupName || 'Pro'}</span>
                                        <span className="account-id"># {acc.accountNumber}</span>
                                    </div>
                                </div>

                                <div className="account-body">
                                    <div className="amount">
                                        <span className="amount-whole">{Math.floor(acc.walletBalance || 0)}</span>
                                        <span className="amount-decimal">.{(acc.walletBalance || 0).toFixed(2).split('.')[1]}</span>
                                        <span className="currency">{acc.currency || 'USD'}</span>
                                    </div>

                                    <div className="account-actions">
                                        <button className="btn-action btn-trade" onClick={() => window.open('/trading-terminal', '_blank')}>
                                            <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>&#x21c4;</span>
                                            {t('Trade')}
                                        </button>
                                        <button className="btn-action">
                                            <ArrowDownToLine size={16} />
                                            {t('Deposit')}
                                        </button>
                                        <button className="btn-action">
                                            <ArrowUpToLine size={16} />
                                            {t('Withdraw')}
                                        </button>
                                        <button className="btn-icon">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-accounts">
                            <Info size={40} color="var(--text-muted)" />
                            <p>No {activeTab} accounts found.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
