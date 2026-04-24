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
    const inviteLink = `https://v3.livefxhub.com:8444/signup/${referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOptions = [
        {
            name: t('WhatsApp'),
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.766-5.764-5.766zm3.392 8.221c-.142.399-.715.746-1.158.827-.351.066-.815.119-1.378-.061-.314-.1-.708-.228-1.226-.453-1.897-.822-3.09-2.825-3.185-2.951-.095-.127-.775-.972-.775-1.854 0-.882.463-1.316.627-1.492.164-.176.357-.22.476-.22.12 0 .239 0 .343.006.113.003.262-.042.411.31.153.364.522 1.272.567 1.363.045.09.075.196.015.316-.06.12-.09.196-.18.301-.09.105-.188.234-.268.315-.09.09-.184.188-.079.368.105.18.468.773 1.004 1.25.69.613 1.27.804 1.45.894.18.09.286.075.391-.045.105-.12.449-.525.569-.706.12-.18.239-.15.404-.09.164.06 1.042.492 1.221.582.179.09.299.135.343.21.045.076.045.438-.097.837zM12 0C5.373 0 0 5.373 0 12c0 2.112.546 4.096 1.503 5.823L0 24l6.326-1.632C7.94 23.36 9.89 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.84c-1.861 0-3.585-.515-5.061-1.404l-.363-.22-3.764.969 1-3.64-.24-.383a9.815 9.815 0 01-1.503-5.162c0-5.432 4.419-9.851 9.851-9.851s9.851 4.419 9.851 9.851-4.419 9.851-9.851 9.851z" />
                </svg>
            ),
            color: '#25D366',
            url: `https://wa.me/?text=${encodeURIComponent(t("Join me on LiveFxHub! ") + inviteLink)}`
        },
        {
            name: t('Telegram'),
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.24-.213-.054-.333-.373-.12L6.847 12.96l-2.96-.924c-.645-.203-.658-.645.135-.954l11.566-4.458c.538-.196 1.006.128.846.846z" />
                </svg>
            ),
            color: '#0088cc',
            url: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(t("Join me on LiveFxHub!"))}`
        },
        {
            name: t('Instagram'),
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.56.216.96.474 1.38.894.42.42.678.82.894 1.38.163.422.358 1.057.412 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.249 1.805-.412 2.227-.216.56-.474.96-.894 1.38-.42.42-.82.678-1.38.894-.422.163-1.057.358-2.227.412-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.805-.249-2.227-.412-.56-.216-.96-.474-1.38-.894-.42-.42-.678-.82-.894-1.38-.163-.422-.358-1.057-.412-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.054-1.17.249-1.805.412-2.227.216-.56.474-.96.894-1.38.42-.42.82-.678 1.38-.894.422-.163 1.057-.358 2.227-.412 1.266-.058 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126s1.384 1.078 2.126 1.384c.766.296 1.636.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384s1.078-1.384 1.384-2.126c.296-.765.499-1.636.558-2.913.058-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126s-1.384-1.078-2.126-1.384c-.765-.297-1.636-.499-2.913-.558C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
            ),
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
                            <h3>Share Invite Link</h3>
                            <button className="close-share-modal" onClick={() => setShowShareModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="share-modal-body">
                            <p>Select a platform to share your unique link with friends.</p>

                            <div className="share-platforms-grid">
                                {shareOptions.map(option => (
                                    <a
                                        key={option.name}
                                        href={option.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="share-platform-item"
                                    >
                                        <div className="platform-icon-box" style={{ backgroundColor: option.color }}>
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
