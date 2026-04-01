import React, { useState } from 'react';
import { 
    Copy, Wallet, TrendingUp, UserCheck, Users, 
    ChevronRight, CreditCard, ShieldCheck, BadgeCheck,
    Phone, Mail, MessageSquare, ExternalLink, Download, User, Check,
    Facebook, Twitter, Linkedin, Share2, Instagram, MessageCircle
} from 'lucide-react';

export default function IBProfile({ ibData }) {
    if (!ibData) return null;

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
                setInviteStatus({ type: 'success', message: 'Invitation sent successfully!' });
                setInviteEmail('');
            } else {
                setInviteStatus({ type: 'error', message: 'Failed to send invitation. Please try again.' });
            }
        } catch (err) {
            setInviteStatus({ type: 'error', message: 'Network error. Could not send invitation.' });
        } finally {
            setIsInviting(false);
            setTimeout(() => setInviteStatus({ type: '', message: '' }), 4000);
        }
    };

    const shareOnSocial = (platform) => {
        const text = `Join my trading network on LiveFXHub! Use my referral link: `;
        const url = encodeURIComponent(referralLink);
        let shareUrl = '';

        switch (platform) {
            case 'whatsapp': shareUrl = `https://wa.me/?text=${encodeURIComponent(text + referralLink)}`; break;
            case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
            case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`; break;
            case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
            case 'instagram': 
                alert('Instagram sharing requires manual link placement. Link copied!');
                handleCopy(); 
                return;
        }
        if (shareUrl) window.open(shareUrl, '_blank');
    };

    return (
        <div className="ib-profile-dashboard">
            <div className="profile-hero-section">
                <div className="hero-promo-card">
                    <div className="promo-text-side">
                        <span className="promo-tag">Partner Program</span>
                        <h1>Build your team and earn more commissions</h1>
                        <p>Invite traders to LiveFXHub and earn up to $3.5 per lot. Track your performance and scale your network with our advanced IB tools.</p>
                        <button className="promo-cta-btn">Learn More</button>
                    </div>
                    <div className="promo-img-side">
                        <img src="/brain/85cded9e-f241-41e5-b12a-4ebf4a0934e0/ib_partnership_hero_illustration_1775042320555.png" alt="Partnership" />
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
                            <span>LEVEL {ibData?.ib_level || 1} PARTNER</span>
                        </div>
                    </div>

                    <div className="partner-details-stack">
                        <div className="detail-row-stack">
                            <span className="lbl">Email Address</span>
                            <span className="val">{userData?.email || 'N/A'}</span>
                        </div>
                        <div className="detail-row-stack">
                            <span className="lbl">Mobile Number</span>
                            <span className="val">{ibData?.whatsapp_number || 'N/A'}</span>
                        </div>
                        <div className="detail-row-stack">
                            <span className="lbl">KYC Status</span>
                            <span className="val-status-pill">{ibData?.kyc_status?.toUpperCase() || 'NONE'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="referral-recruitment-hub">
                <div className="hub-header">
                    <h2>Referral Program</h2>
                    <p>Use your unique link to recruit new traders and earn institutional-grade commissions.</p>
                </div>
                
                <div className="hub-core-grid">
                    <div className="recruitment-node">
                        <div className="node-head">
                            <span className="node-lbl">YOUR UNIQUE CODE</span>
                            <div className="code-badge-premium">{referralCode || '---'}</div>
                        </div>
                        <label>Your Referral Link</label>
                        <div className="link-copy-field">
                            <input type="text" readOnly value={referralLink} />
                            <button className={`copy-action-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                <span>{copied ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>
                        
                        <div className="social-sharing-footer">
                            <span>QUICK SHARE:</span>
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
                            <span className="node-lbl">RECRUIT TRADERS</span>
                        </div>
                        <label>Direct Email Invite</label>
                        <div className="email-invite-field">
                            <input 
                                type="email" 
                                placeholder="client@example.com" 
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                            <button 
                                className="send-invite-btn" 
                                onClick={handleSendInvite}
                                disabled={isInviting || !inviteEmail}
                            >
                                {isInviting ? 'Sending...' : 'Send Invite'}
                            </button>
                        </div>
                        {inviteStatus.message && (
                            <div className={`invite-status-msg ${inviteStatus.type}`}>
                                {inviteStatus.message}
                            </div>
                        )}
                        <p className="invite-disclaimer">Recruit via direct email to ensure high conversion rates.</p>
                    </div>
                </div>
            </div>

            {ibData?.rejection_reason && (
                <div className="rejection-notice-premium">
                    <ShieldCheck size={24} />
                    <div className="rejection-text">
                        <strong>Partnership Application Update</strong>
                        <p>{ibData.rejection_reason}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
