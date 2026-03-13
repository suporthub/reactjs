import React, { useState } from 'react';
import { Mail, MessageSquare, PhoneCall, X, Copy, Check } from 'lucide-react';
import LiveChat from './LiveChat';
import { useTranslation } from 'react-i18next';
import './support.css';

export default function Support() {
    const { t } = useTranslation();
    const [currentView, setCurrentView] = useState('main'); // 'main' or 'live-chat'
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const supportEmail = "support@livefxhub.com";

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(supportEmail);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleActionClick = (id) => {
        if (id === 'email-support') {
            setIsEmailModalOpen(true);
        } else if (id === 'telegram') {
            window.open('https://t.me/LiveFxHub_support_bot', '_blank');
        } else if (id === 'live-chat') {
            setCurrentView('live-chat');
        }
    };

    const supportOptions = [
        {
            id: 'email-support',
            title: t('Email support'),
            description: t('Email support desc'),
            image: '/images/support-ticket.png',
            actionText: t('Send an email'),
            actionIcon: <Mail size={16} strokeWidth={2.5} />
        },
        {
            id: 'live-chat',
            title: t('Live chat'),
            description: t('Live chat desc'),
            image: '/images/support-chat.png',
            actionText: t('Start chat'),
            actionIcon: <MessageSquare size={16} strokeWidth={2.5} />
        },
        {
            id: 'telegram',
            title: t('Telegram support'),
            description: t('Telegram support desc'),
            image: '/images/support-telegram.png',
            actionText: '@LiveFxHub_support_bot',
            actionIcon: <PhoneCall size={16} strokeWidth={2.5} />
        }
    ];

    if (currentView === 'live-chat') {
        return (
            <div className="page-content live-chat-full-page">
                <LiveChat onBack={() => setCurrentView('main')} />
            </div>
        );
    }

    return (
        <div className="page-content support-page">
            <div className="support-wrapper">
                <div className="support-header">
                    <h1>{t('Contact us')}</h1>
                </div>

                <div className="support-cards-grid">
                    {supportOptions.map((option) => (
                        <div key={option.id} className="support-card">
                            <div className="support-card-image">
                                <img src={option.image} alt={option.title} />
                            </div>
                            <div className="support-card-content">
                                <h3>{option.title}</h3>
                                <p>{option.description}</p>

                                <button
                                    className="support-action-btn"
                                    onClick={() => handleActionClick(option.id)}
                                >
                                    {option.actionIcon}
                                    <span>{option.actionText}</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Email Support Modal */}
            {isEmailModalOpen && (
                <div className="support-modal-overlay" onClick={() => setIsEmailModalOpen(false)}>
                    <div className="support-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="support-modal-header">
                            <h2>{t('Email Support Modal')}</h2>
                            <button className="close-modal-btn" onClick={() => setIsEmailModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="support-modal-body">
                            <p className="support-modal-desc">
                                {t('Email modal desc')}
                            </p>

                            <div className="email-copy-box">
                                <span className="email-text">{supportEmail}</span>
                                <button className="copy-email-btn" onClick={handleCopyEmail}>
                                    {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                                    <span>{copied ? t('Copied') : t('Copy')}</span>
                                </button>
                            </div>

                            <a href={`mailto:${supportEmail}`} className="mailto-btn">
                                {t('Open Email Client')}
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
