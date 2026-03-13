import React from 'react';
import './copytrading.css';
import Discover from './Discover';
import MyStrategies from './MyStrategies';
import Assets from './Assets';
import Favorites from './Favorites';
import { useTranslation } from 'react-i18next';

export default function CopyTrading({ activeTab, setActiveTab }) {
    const { t } = useTranslation();

    const renderContent = () => {
        switch (activeTab) {
            case 'Discover': return <Discover />;
            case 'My strategies': return <MyStrategies />;
            case 'Assets': return <Assets />;
            case 'Favorites': return <Favorites />;
            default: return null;
        }
    };

    return (
        <main className="main-content copy-trading-content">
            <div className="content-area">

                <div className="section-header">
                    <h1>{t('Copy Trading')}</h1>
                </div>

                {/* Sub Navigation Tabs */}
                <div className="page-tabs">
                    <button className={`page-tab ${activeTab === 'Discover' ? 'active' : ''}`} onClick={() => setActiveTab('Discover')}>{t('Discover')}</button>
                    <button className={`page-tab ${activeTab === 'My strategies' ? 'active' : ''}`} onClick={() => setActiveTab('My strategies')}>{t('My strategies')}</button>
                    <button className={`page-tab ${activeTab === 'Assets' ? 'active' : ''}`} onClick={() => setActiveTab('Assets')}>{t('Assets')}</button>
                    <button className={`page-tab ${activeTab === 'Favorites' ? 'active' : ''}`} onClick={() => setActiveTab('Favorites')}>{t('Favorites')}</button>
                </div>

                {renderContent()}

            </div>
        </main>
    );
}
