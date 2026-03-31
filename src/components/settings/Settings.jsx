import React, { useState } from 'react';
import { BadgeCheck, LogOut, User, Lock, Trash2 } from 'lucide-react';
import Profile from './Profile';
import Security from './Security';
import KycUpdate from './KycUpdate';
import DeleteAccount from './DeleteAccount';
import { useTranslation } from 'react-i18next';
import './settings.css';

export default function Settings() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('Profile');

    const renderContent = () => {
        switch (activeTab) {
            case 'Profile':
                return <Profile />;
            case 'Security':
                return <Security />;
            case 'KYC':
                return <KycUpdate />;
            case 'Delete':
                return <DeleteAccount />;
            default:
                return <Profile />;
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>{t('Account Settings')}</h1>
            </div>

            <div className="settings-layout">
                <div className="settings-sidebar">
                    <div className="settings-nav">
                        <button 
                            className={`settings-nav-item ${activeTab === 'Profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Profile')}
                        >
                            <User size={16} />
                            {t('My Profile')}
                        </button>
                        <button 
                            className={`settings-nav-item ${activeTab === 'Security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Security')}
                        >
                            <Lock size={16} />
                            {t('Security')}
                        </button>
                        <button
                            className={`settings-nav-item settings-nav-item-kyc ${activeTab === 'KYC' ? 'active' : ''}`}
                            onClick={() => setActiveTab('KYC')}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <BadgeCheck size={16} />
                                {t('KYC Update')}
                            </span>
                            <span className="settings-nav-pill">New</span>
                        </button>
                        
                        <button 
                            className={`settings-nav-item delete-tab ${activeTab === 'Delete' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Delete')}
                        >
                            <Trash2 size={16} />
                            {t('Delete Account')}
                        </button>
                    </div>

                    <button className="settings-logout-btn">
                        <LogOut size={18} />
                        {t('Logout')}
                    </button>
                </div>

                <div className="settings-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
