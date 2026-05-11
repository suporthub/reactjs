import React from 'react';
import './dashboard.css';
import TradingNews from './TradingNews';
import { useTranslation } from 'react-i18next';
import { Clock, Info, ShieldCheck, AlertCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const userDataStr = localStorage.getItem('userData');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const displayName = userData?.firstName || 'Trader';
    const kycStatus = userData?.kycStatus || 'not_started';

    return (
        <main className="main-content dashboard-content">
            <div className="content-area">
                
                {/* KYC Pending Banner */}
                {kycStatus === 'pending' && (
                    <div className="kyc-banner pending" onClick={() => navigate('/settings', { state: { activeTab: 'KYC' } })}>
                        <div className="kyc-banner-left">
                            <div className="kyc-icon-wrapper">
                                <Clock size={20} />
                            </div>
                            <div className="kyc-banner-text">
                                <h3>{t('Verification in Progress')}</h3>
                                <p>{t('Your identity documents are currently under review by our compliance team.')}</p>
                            </div>
                        </div>
                        <div className="kyc-banner-right">
                            <span className="kyc-status-tag">{t('Pending')}</span>
                            <ChevronRight size={18} />
                        </div>
                    </div>
                )}

                {/* Welcome Card */}
                <div className="welcome-card">
                    <div className="welcome-text">
                        <h1>{t('Hello')}, {displayName}</h1>
                        <p>{t('Power your day')}</p>
                    </div>
                    <div className="welcome-illustration">
                        <img src="/trading_user.png" alt="Professional Trader" className="welcome-img" />
                    </div>
                </div>

                {/* Daily Trading News */}
                <TradingNews />

            </div>
        </main>
    );
}
