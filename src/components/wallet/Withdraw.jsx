import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bitcoin, Landmark, CreditCard, Smartphone, Wallet, Info, ArrowLeft, ShieldAlert, FileText, ChevronRight, History, PlusCircle, Check, Loader2, Plus, Eye, EyeOff } from 'lucide-react';
import CryptoWithdraw from './CryptoWithdraw';
import VietnamWithdraw from './VietnamWithdraw';
import AddWithdrawDetails from './AddWithdrawDetails';

export default function Withdraw({ selectedMethod, setSelectedMethod, isAddingDetails, setIsAddingDetails }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const userDataStr = localStorage.getItem('userData');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const countryCode = userData?.countryCode || userData?.country || '';

    const [savedMethods, setSavedMethods] = useState([]);
    const [loadingMethods, setLoadingMethods] = useState(false);
    const [selectedSavedMethod, setSelectedSavedMethod] = useState(null);
    const [showNewAccountForm, setShowNewAccountForm] = useState(false);
    const [visibleAccounts, setVisibleAccounts] = useState({});

    const toggleAccountVisibility = (e, id) => {
        e.stopPropagation();
        setVisibleAccounts(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const maskAccountNumber = (number) => {
        if (!number) return '';
        const numStr = String(number);
        if (numStr.length <= 4) return numStr;
        return `*** *** ${numStr.slice(-4)}`;
    };


    const withdrawMethods = [
        {
            id: 'crypto',
            name: 'Crypto',
            icon: Bitcoin,
            color: '#f7931a',
            processing: '1 - 24 hours',
            fee: '0.00%',
            limits: '10 - 50,000 USD',
            type: 'CRYPTO'
        },
        {
            id: 'bank-transfer',
            name: 'Bank Transfer',
            icon: Landmark,
            color: '#4b5563',
            processing: '1 - 3 business days',
            fee: '0.00%',
            limits: '100 - 100,000 USD',
            type: 'BANK'
        },
        ...(countryCode === 'VN' ? [{
            id: 'vietnam-withdraw',
            name: 'Vietnam Withdraw',
            icon: Landmark,
            color: '#10b981',
            processing: '1 - 24 hours',
            fee: '0.00%',
            limits: '100 - 5,000 USD',
            type: 'BANK'
        }] : []),
        {
            id: 'upi',
            name: 'UPI / Mobile Wallet',
            icon: Smartphone,
            color: '#6366f1',
            processing: 'Instant',
            fee: '0.00%',
            limits: '10 - 2,000 USD',
            type: 'OTHER'
        }
    ];

    useEffect(() => {
        if (selectedMethod) {
            fetchSavedMethods();
            setSelectedSavedMethod(null);
            setShowNewAccountForm(false);
        }
    }, [selectedMethod]);

    const fetchSavedMethods = async () => {
        setLoadingMethods(true);
        const token = localStorage.getItem('portalToken');
        try {
            const response = await fetch('https://v3.livefxhub.com:8444/api/financial/payment-methods', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setSavedMethods(result.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch payment methods:', error);
        } finally {
            setLoadingMethods(false);
        }
    };
    
    const kycStatus = userData?.kycStatus?.toLowerCase() || 'not_started';

    if (kycStatus !== 'approved') {
        return (
            <div className="wallet-tab-content">
                <div className="kyc-restriction-container">
                    <div className="kyc-lock-icon">
                        <ShieldAlert size={48} color="#f59e0b" />
                    </div>
                    <h2>{t('Verification Required')}</h2>
                    <p>
                        {kycStatus === 'pending' 
                            ? t('Your KYC verification is currently under review. Withdrawals will be enabled once your account is fully verified.')
                            : t('To ensure the security of your funds and comply with financial regulations, please complete your identity verification to enable withdrawals.')}
                    </p>
                    
                    <div className="kyc-status-badge-large" data-status={kycStatus}>
                        {t(kycStatus)}
                    </div>

                    <button 
                        className="kyc-primary-btn" 
                        style={{ marginTop: '32px', maxWidth: '300px' }}
                        onClick={() => navigate('/settings', { state: { activeTab: 'KYC' } })}
                    >
                        {t('Complete Verification')}
                        <ChevronRight size={18} style={{ marginLeft: '8px' }} />
                    </button>
                    
                    <div className="kyc-info-grid">
                        <div className="info-item">
                            <FileText size={20} />
                            <span>{t('Instant fund security')}</span>
                        </div>
                        <div className="info-item">
                            <Landmark size={20} />
                            <span>{t('Higher limits enabled')}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentMethodObj = withdrawMethods.find(m => m.id === selectedMethod);
    const filteredSavedMethods = savedMethods.filter(m => m.type === currentMethodObj?.type);

    return (
        <div className="wallet-tab-content">
            <div className="withdraw-view-container">
                
                {isAddingDetails ? (
                    <AddWithdrawDetails onBack={() => setIsAddingDetails(false)} />
                ) : selectedMethod ? (
                    <>
                        <button className="deposit-back-btn" onClick={() => setSelectedMethod(null)}>
                            <ArrowLeft size={18} />
                            <span>{t('Back')}</span>
                        </button>

                        <div className="payment-view-header" style={{ marginBottom: '32px' }}>
                            <h2>{t('Withdrawal via')} {t(currentMethodObj?.name)}</h2>
                        </div>

                        {loadingMethods ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                                <Loader2 className="spin" size={32} color="var(--primary)" />
                            </div>
                        ) : (
                            <>
                                <div className="saved-accounts-section" style={{ marginBottom: '32px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                        {filteredSavedMethods.length > 0 ? t('Choose a saved account') : t('No saved accounts found')}
                                    </h3>
                                    <div className="saved-methods-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                        {!showNewAccountForm && filteredSavedMethods.map(method => (
                                            <div 
                                                key={method.id} 
                                                className={`saved-method-card ${selectedSavedMethod?.id === method.id ? 'active' : ''}`}
                                                onClick={() => setSelectedSavedMethod(method)}
                                                style={{ 
                                                    background: method.type === 'BANK' ? 'linear-gradient(120deg, #8ba8c4 0%, #d4c5c2 50%, #dfa579 100%)' : 'linear-gradient(120deg, #667eea 0%, #764ba2 100%)',
                                                    borderRadius: '16px',
                                                    padding: '20px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    position: 'relative',
                                                    boxShadow: selectedSavedMethod?.id === method.id ? '0 0 0 3px var(--primary), 0 12px 24px rgba(0,0,0,0.2)' : '0 6px 16px rgba(0,0,0,0.1)',
                                                    transform: selectedSavedMethod?.id === method.id ? 'translateY(-4px)' : 'none',
                                                    overflow: 'hidden',
                                                    color: '#ffffff',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    minHeight: '150px'
                                                }}
                                            >
                                                {/* Decorative Noise Overlay */}
                                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15, pointerEvents: 'none', mixBlendMode: 'overlay', backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                                                    <div style={{ 
                                                        width: '40px', height: '40px', borderRadius: '50%', 
                                                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                        border: '1px solid rgba(255,255,255,0.3)' 
                                                    }}>
                                                        {method.type === 'BANK' ? <Landmark size={20} color="#fff" /> : <Bitcoin size={20} color="#fff" />}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                        {method.isDefault && (
                                                            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '2px 8px', borderRadius: '40px', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '4px', backdropFilter: 'blur(4px)' }}>
                                                                {t('DEFAULT')}
                                                            </span>
                                                        )}
                                                        <span style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.95)' }}>
                                                            {method.label || method.providerName}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: '16px' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                        {method.details?.accountName || method.accountName}
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ fontSize: '13px', letterSpacing: '2px', fontWeight: '600', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)' }}>
                                                                {visibleAccounts[method.id] ? (method.details?.accountNumber || method.accountNumber) : maskAccountNumber(method.details?.accountNumber || method.accountNumber)}
                                                            </div>
                                                            <button 
                                                                onClick={(e) => toggleAccountVisibility(e, method.id)}
                                                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                            >
                                                                {visibleAccounts[method.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            </button>
                                                        </div>
                                                        {method.type === 'CRYPTO' && (
                                                            <div style={{ fontSize: '10px', background: 'rgba(0,0,0,0.25)', padding: '3px 6px', borderRadius: '4px', fontWeight: '700', backdropFilter: 'blur(4px)' }}>
                                                                {method.details?.network || method.network}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {selectedSavedMethod?.id === method.id && (
                                                    <div style={{ marginTop: '16px', animation: 'fadeIn 0.2s ease', position: 'relative', zIndex: 1 }}>
                                                        <button style={{ 
                                                            width: '100%', height: '36px', borderRadius: '10px', 
                                                            background: '#ffffff', color: '#000000', 
                                                            border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                            transition: 'background 0.2s'
                                                        }}>
                                                            {t('Use this account')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        
                                        {!showNewAccountForm && (
                                            <div 
                                                className="add-new-saved-card"
                                                onClick={() => setIsAddingDetails(true)}
                                                style={{ 
                                                    border: '2px dashed var(--border-color)',
                                                    borderRadius: '16px',
                                                    padding: '24px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '12px',
                                                    minHeight: '160px',
                                                    transition: 'all 0.2s',
                                                    background: 'rgba(255,255,255,0.02)'
                                                }}
                                            >
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-light)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                                    <Plus size={24} />
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>{t('Use a new account')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {showNewAccountForm && (
                                    <>
                                        {selectedMethod === 'crypto' && <CryptoWithdraw />}
                                        {selectedMethod === 'vietnam-withdraw' && <VietnamWithdraw />}
                                        {selectedMethod === 'bank-transfer' && <div>{t('Bank Transfer logic here...')}</div>}
                                        {selectedMethod === 'upi' && <div>{t('UPI logic here...')}</div>}
                                        
                                        <button 
                                            style={{ marginTop: '20px', background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            onClick={() => setShowNewAccountForm(false)}
                                        >
                                            <ArrowLeft size={16} />
                                            {t('Back to saved accounts')}
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <>
                        {/* Balance Summary Card */}
                <div className="balance-overview-card">
                    <div className="balance-left">
                        <div className="total-label">{t('Available for Withdrawal')}</div>
                        <div className="total-amount">$5,240.00</div>
                        <div className="balance-stats">
                            <div className="stat">
                                <span className="stat-label">{t('Total Balance:')}</span>
                                <span className="stat-value">$12,850.40</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">{t('In Orders:')}</span>
                                <span className="stat-value">$7,610.40</span>
                            </div>
                        </div>
                    </div>
                    <div className="balance-right">
                        <div className="balance-icon-bg">
                            <Wallet size={32} />
                        </div>
                    </div>
                </div>

                <div className="withdraw-list-header">
                    <h2>{t('Withdrawal Methods')}</h2>
                    <div className="info-badge">
                        <Info size={14} />
                        <span>{t('Withdrawals are processed according to the sequence of deposits.')}</span>
                    </div>
                </div>

                <div className="withdraw-methods-list">
                    {withdrawMethods.map((method) => (
                        <div key={method.id} className="withdraw-list-item">
                            <div className="item-main">
                                <div className="method-icon-circle-box" style={{ color: method.color, backgroundColor: `${method.color}15` }}>
                                    <method.icon size={22} />
                                </div>
                                <div className="item-info">
                                    <div className="withdrawal-method-name">{t(method.name)}</div>
                                    <div className="withdrawal-method-processed">{t('Processed within')} {t(method.processing)}</div>
                                </div>
                            </div>

                            <div className="item-meta">
                                <div className="meta-group">
                                    <span className="label">{t('Fee:')}</span>
                                    <span className="value free">{t(method.fee)}</span>
                                </div>
                                <div className="meta-group">
                                    <span className="label">{t('Limits:')}</span>
                                    <span className="value">{t(method.limits)}</span>
                                </div>
                            </div>

                            <button className="withdraw-btn-action" onClick={() => setSelectedMethod(method.id)}>
                                {t('Withdraw')}
                            </button>
                        </div>
                    ))}
                </div>
                    </>
                )}
            </div>
        </div>
    );
}
