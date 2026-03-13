import React from 'react';
import './dashboard.css';
import TradingNews from './TradingNews';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
    const { t } = useTranslation();
    return (
        <main className="main-content dashboard-content">
            <div className="content-area">

                {/* Welcome Card */}
                <div className="welcome-card">
                    <div className="welcome-text">
                        <h1>{t('Hello')}, Nithin</h1>
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
