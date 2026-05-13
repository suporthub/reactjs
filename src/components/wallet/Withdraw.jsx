import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bitcoin, Landmark, CreditCard, Smartphone, Wallet, Info, ArrowLeft, ShieldAlert, FileText, ChevronRight, History, PlusCircle } from 'lucide-react';
import CryptoWithdraw from './CryptoWithdraw';
import VietnamWithdraw from './VietnamWithdraw';
import AddWithdrawDetails from './AddWithdrawDetails';

export default function Withdraw({ selectedMethod, setSelectedMethod, isAddingDetails, setIsAddingDetails }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const userDataStr = localStorage.getItem('userData');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const countryCode = userData?.countryCode || userData?.country || '';

    const withdrawMethods = [
        {
            id: 'crypto',
            name: 'Crypto',
            icon: Bitcoin,
            color: '#f7931a',
            processing: '1 - 24 hours',
            fee: '0.00%',
            limits: '10 - 50,000 USD'
        },
        {
            id: 'bank-transfer',
            name: 'Bank Transfer',
            icon: Landmark,
            color: '#4b5563',
            processing: '1 - 3 business days',
            fee: '0.00%',
            limits: '100 - 100,000 USD'
        },
        ...(countryCode === 'VN' ? [{
            id: 'vietnam-withdraw',
            name: 'Vietnam Withdraw',
            icon: Landmark,
            color: '#10b981',
            processing: '1 - 24 hours',
            fee: '0.00%',
            limits: '100 - 5,000 USD'
        }] : []),
        {
            id: 'upi',
            name: 'UPI / Mobile Wallet',
            icon: Smartphone,
            color: '#6366f1',
            processing: 'Instant',
            fee: '0.00%',
            limits: '10 - 2,000 USD'
        }
    ];
    
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
                            <h2>{t('Withdrawal via')} {t(withdrawMethods.find(m => m.id === selectedMethod)?.name)}</h2>
                        </div>

                        {selectedMethod === 'crypto' && <CryptoWithdraw />}
                        {selectedMethod === 'vietnam-withdraw' && <VietnamWithdraw />}
                        {selectedMethod === 'bank-transfer' && <div>{t('Bank Transfer logic here...')}</div>}
                        {selectedMethod === 'upi' && <div>{t('UPI logic here...')}</div>}
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
