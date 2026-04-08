import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './IBProfile.css';
import { 
    Copy, Wallet, TrendingUp, UserCheck, Users, 
    ChevronRight, CreditCard, ShieldCheck, BadgeCheck,
    Phone, Mail, MessageSquare, ExternalLink, Download, User, Check,
    Facebook, Twitter, Linkedin, Share2, Instagram, MessageCircle
} from 'lucide-react';

export default function IBProfile({ ibData }) {
    if (!ibData) return null;

    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteStatus, setInviteStatus] = useState({ type: '', message: '' });
    const [isInviting, setIsInviting] = useState(false);

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const token = localStorage.getItem('token');
    const referralCode = ibData?.referal_code || '';
    const referralLink = `https://v3.livefxhub.com:8444/signup/${referralCode}`;
    const fullName = `${ibData?.first_name || ''} ${ibData?.last_name || ''}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendInvite = async () => {
        if (!inviteEmail) return;
        setIsInviting(true);
        setInviteStatus({ type: '', message: '' });

        try {
            const response = await fetch('https://v3.livefxhub.com:8444/api/ib/send-invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: inviteEmail })
            });

            if (response.ok) {
                setInviteStatus({ type: 'success', message: t('Invitation sent successfully!') });
                setInviteEmail('');
            } else {
                setInviteStatus({ type: 'error', message: t('Failed to send invitation. Please try again.') });
            }
        } catch (err) {
            setInviteStatus({ type: 'error', message: t('Network error. Could not send invitation.') });
        } finally {
            setIsInviting(false);
            setTimeout(() => setInviteStatus({ type: '', message: '' }), 4000);
        }
    };

    const shareOnSocial = (platform) => {
        switch (platform) {
            case 'whatsapp': shareUrl = `https://wa.me/?text=${encodeURIComponent(t('Join my trading network on LiveFXHub! Use my referral link: ') + referralLink)}`; break;
            case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
            case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(t('Join my trading network on LiveFXHub! Use my referral link: '))}&url=${url}`; break;
            case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
            case 'instagram': 
                alert(t('Instagram sharing requires manual link placement. Link copied!'));
                handleCopy(); 
                return;
        }
        if (shareUrl) window.open(shareUrl, '_blank');
    };

    const banners = [
        '/ib_banner.png',
        '/live_hero_v2.png',
        '/demo_hero_v2.png'
    ];
    
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
        }, 20000); // 20 seconds
        return () => clearInterval(interval);
    }, [banners.length]);

    return (
        <div className="ib-profile-dashboard">
            <div className="profile-hero-section">
                <div className="hero-promo-banner-main">
                    <img key={currentBannerIndex} src={banners[currentBannerIndex]} alt={`Partner Program Banner ${currentBannerIndex + 1}`} className="fade-in-banner" />
                    
                    <div className="promo-carousel-dots">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                className={`promo-car-dot ${index === currentBannerIndex ? 'active' : ''}`}
                                onClick={() => setCurrentBannerIndex(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="user-info-status-card centered-theme">
                    <div className="user-identity-core">
                        <div className="avatar-large-centered">
                            <User size={32} />
                        </div>
                        <h3>{fullName}</h3>
                        <div className="ib-level-medal-v2">
                            <BadgeCheck size={14} />
                            <span>{t('LEVEL')} {ibData?.ib_level || 1} {t('PARTNER')}</span>
                        </div>
                    </div>

                    <div className="partner-details-stack">
                        <div className="detail-row-stack">
                            <span className="lbl">{t('Email Address')}</span>
                            <span className="val">{userData?.email || t('N/A')}</span>
                        </div>
                        <div className="detail-row-stack">
                            <span className="lbl">{t('Mobile Number')}</span>
                            <span className="val">{ibData?.whatsapp_number || t('N/A')}</span>
                        </div>
                        <div className="detail-row-stack">
                            <span className="lbl">{t('KYC Status')}</span>
                            <span className={`val-status-pill ${ibData?.kyc_status?.toLowerCase()}`}>
                                {t(ibData?.kyc_status?.toUpperCase() || 'NONE')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="referral-recruitment-hub">
                <div className="hub-header">
                    <h2>{t('Referral Program')}</h2>
                    <p>{t('Use your unique link to recruit new traders and earn institutional-grade commissions.')}</p>
                </div>
                
                <div className="hub-core-grid">
                    <div className="recruitment-node">
                        <div className="node-head">
                            <span className="node-lbl">{t('YOUR UNIQUE CODE')}</span>
                            <div className="code-badge-premium">{referralCode || t('---')}</div>
                        </div>
                        <label>{t('Your Referral Link')}</label>
                        <div className="link-copy-field">
                            <input type="text" readOnly value={referralLink} />
                            <button className={`copy-action-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                <span>{copied ? t('Copied') : t('Copy')}</span>
                            </button>
                        </div>
                        
                        <div className="social-sharing-footer">
                            <span>{t('QUICK SHARE:')}</span>
                            <div className="sharing-icons-row">
                                <button onClick={() => shareOnSocial('whatsapp')} className="social-icon wa" title="Share on WhatsApp"><MessageCircle size={16} /></button>
                                <button onClick={() => shareOnSocial('facebook')} className="social-icon fb" title="Share on Facebook"><Facebook size={16} /></button>
                                <button onClick={() => shareOnSocial('twitter')} className="social-icon tw" title="Share on Twitter"><Twitter size={16} /></button>
                                <button onClick={() => shareOnSocial('instagram')} className="social-icon ig" title="Share on Instagram"><Instagram size={16} /></button>
                                <button onClick={() => shareOnSocial('linkedin')} className="social-icon ln" title="Share on LinkedIn"><Linkedin size={16} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="recruitment-node">
                        <div className="node-head">
                            <span className="node-lbl">{t('RECRUIT TRADERS')}</span>
                        </div>
                        <label>{t('Direct Email Invite')}</label>
                        <div className="email-invite-field">
                            <input 
                                type="email" 
                                placeholder={t('client@example.com')} 
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                            <button 
                                className="send-invite-btn" 
                                onClick={handleSendInvite}
                                disabled={isInviting || !inviteEmail}
                            >
                                {isInviting ? t('Sending...') : t('Send Invite')}
                            </button>
                        </div>
                        {inviteStatus.message && (
                            <div className={`invite-status-msg ${inviteStatus.type}`}>
                                {inviteStatus.message}
                            </div>
                        )}
                        <p className="invite-disclaimer">{t('Recruit via direct email to ensure high conversion rates.')}</p>
                    </div>
                </div>
            </div>

            {ibData?.rejection_reason && (
                <div className="rejection-notice-premium">
                    <ShieldCheck size={24} />
                    <div className="rejection-text">
                        <strong>{t('Partnership Application Update')}</strong>
                        <p>{ibData.rejection_reason}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
