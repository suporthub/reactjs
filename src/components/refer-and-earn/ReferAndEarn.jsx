import React, { useState } from 'react';
import { Send, Tag, CircleDollarSign, ArrowRight, Check, X, Share2, Instagram, MessageCircle, Send as TelegramIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './refer-earn.css';

export default function ReferAndEarn() {
    const { t } = useTranslation();
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const userDataStr = localStorage.getItem('userData');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const referralCode = userData?.referralCode || '';
    const inviteLink = `https://v3.livefxhub.com:8444/${referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOptions = [
        { 
            name: t('WhatsApp'), 
            icon: <MessageCircle size={24} />, 
            color: '#25D366',
            url: `https://wa.me/?text=${encodeURIComponent(t("Join me on LiveFxHub! ") + inviteLink)}`
        },
        { 
            name: t('Telegram'), 
            icon: <TelegramIcon size={24} />, 
            color: '#0088cc',
            url: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(t("Join me on LiveFxHub!"))}`
        },
        { 
            name: t('Instagram'), 
            icon: <Instagram size={24} />, 
            color: '#E4405F',
            url: `https://www.instagram.com/` // Instagram doesn't have a direct share URL like others, usually redirected to profile or app
        }
    ];

    return (
        <div className="page-content refer-earn-page">
            {/* Copy Notification Toast */}
            {copied && (
                <div className="copy-toast">
                    <Check size={16} />
                    <span>{t('Link copied')}</span>
                </div>
            )}
            <div className="refer-earn-wrapper">
                <div className="refer-header">
                    <h1>{t('Refer & Earn')}</h1>
                </div>

                <div className="refer-container">
                    <div className="refer-left-column">
                        {/* Main Banner Card */}
                        <div className="refer-main-card">
                            <div className="refer-banner-graphic">
                                <img src="/images/refer-earn-banner.png" alt={t("Refer and earn")} className="refer-banner-img" />
                            </div>

                            <div className="refer-main-content">
                                <h2>{t('Earn $250')}</h2>
                                <p>{t('Invite friends')}</p>

                                <div className="share-link-section">
                                    <span>{t('Share link')}</span>
                                    <div className="link-input-group">
                                        <div className="link-input-wrapper">
                                            <input type="text" value={inviteLink} readOnly />
                                            <button className="inline-copy-btn" onClick={handleCopy}>
                                                {copied ? <Check size={16} color="#22c55e" /> : t('Copy')}
                                            </button>
                                        </div>
                                        <button className="send-invites-btn" onClick={() => setShowShareModal(true)}>{t('Send Invites')}</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* How It Works Card */}
                        <div className="how-it-works-card">
                            <h3>{t('How it works')}</h3>

                            <div className="steps-grid">
                                <div className="step-item">
                                    <div className="step-icon">
                                        <Send size={24} />
                                    </div>
                                    <h4>{t('Send invites')}</h4>
                                    <p>{t('Send invites desc')}</p>
                                </div>

                                <div className="step-item">
                                    <div className="step-icon">
                                        <Tag size={24} />
                                    </div>
                                    <h4>{t('Bonus')}</h4>
                                    <p>{t('Bonus desc')}</p>
                                </div>

                                <div className="step-item">
                                    <div className="step-icon">
                                        <CircleDollarSign size={24} />
                                    </div>
                                    <h4>{t('Earn')}</h4>
                                    <p>{t('Earn desc')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="refer-right-column">
                        <div className="redeem-card">
                            <span className="redeem-label">{t('Redeem label')}</span>
                            <div className="redeem-amount">$0</div>
                            <div className="redeem-divider"></div>
                            <button className="track-invites-btn">
                                {t('Track')} <ArrowRight size={16} />
                            </button>
                        </div>
                </div>
            </div>
        </div>
            {/* Share Modal */}
            {showShareModal && (
                <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="share-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="share-modal-header">
                            <h3>{t('Share Modal Title')}</h3>
                            <button className="close-share-modal" onClick={() => setShowShareModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="share-modal-body">
                            <p>{t('Share Modal Desc')}</p>
                            
                            <div className="share-platforms-grid">
                                {shareOptions.map(option => (
                                    <a 
                                        key={option.name} 
                                        href={option.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="share-platform-item"
                                    >
                                        <div className="platform-icon-circle" style={{ backgroundColor: option.color }}>
                                            {option.icon}
                                        </div>
                                        <span>{option.name}</span>
                                    </a>
                                ))}
                            </div>

                            <div className="share-modal-link-copy">
                                <input type="text" value={inviteLink} readOnly />
                                <button onClick={handleCopy}>
                                    {copied ? t('Copied') : t('Copy Link')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
