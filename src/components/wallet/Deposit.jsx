import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bitcoin, Landmark, Wallet, ArrowLeft } from 'lucide-react';
import VietnamDeposit from './VietnamDeposit';
import CryptoDeposit from './CryptoDeposit';
import OtherPaymentDeposit from './OtherPaymentDeposit';

export default function Deposit() {
    const { t } = useTranslation();
    const [selectedMethod, setSelectedMethod] = useState(null);

    const depositMethods = [
        {
            id: 'crypto',
            name: 'Crypto',
            icon: Bitcoin,
            color: '#f7931a', // Bitcoin Orange
            processing: 'Instant - 1 hour',
            fee: '0%',
            limits: '10 - 200,000 USD',
            recommended: true
        },
        {
            id: 'vietnam-deposit',
            name: 'Vietnam Deposit',
            icon: Landmark,
            color: '#10b981', // Emerald Green
            processing: 'Instant - 1 hour',
            fee: '0%',
            limits: '100 - 100,000 USD'
        },
        {
            id: 'other-payment',
            name: 'Other Payment Option',
            icon: Wallet,
            color: '#3b82f6', // Royal Blue
            processing: 'Instant',
            fee: '0%',
            limits: '10 - 50,000 USD'
        }
    ];

    if (selectedMethod) {
        const method = depositMethods.find(m => m.id === selectedMethod);
        return (
            <div className="wallet-tab-content">
                <div className="payment-view-container">
                    <button className="deposit-back-btn" onClick={() => setSelectedMethod(null)}>
                        <ArrowLeft size={18} />
                        <span>{t('Back')}</span>
                    </button>

                    <div className="payment-view-header">
                        <h2>{t('Deposit via')} {t(method.name)}</h2>
                    </div>

                    {method.id === 'vietnam-deposit' && <VietnamDeposit />}
                    {method.id === 'crypto' && <CryptoDeposit />}
                    {method.id === 'other-payment' && <OtherPaymentDeposit />}
                </div>
            </div>
        );
    }

    return (
        <div className="wallet-tab-content">
            <div className="payment-view-container">
                <div className="payment-view-header">
                    <h2>{t('Deposit')}</h2>
                    <p>{t('All payment methods')}</p>
                </div>

                <div className="payment-methods-grid">
                    {depositMethods.map((method) => (
                        <div 
                            key={method.id} 
                            className="payment-method-card clickable"
                            onClick={() => setSelectedMethod(method.id)}
                        >
                            <div className="card-top">
                                <div className="method-identity">
                                    <div className="method-icon-circle" style={{ color: method.color, backgroundColor: `${method.color}15` }}>
                                        <method.icon size={22} />
                                    </div>
                                    <span className="method-name">{t(method.name)}</span>
                                </div>
                                {method.recommended && <span className="recommended-badge">{t('Recommended')}</span>}
                            </div>

                            <div className="card-details">
                                <div className="detail-row">
                                    <span className="label">{t('Processing time')}</span>
                                    <span className="value">{t(method.processing)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">{t('Fee')}</span>
                                    <span className="value">{t(method.fee)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">{t('Limits')}</span>
                                    <span className="value">{t(method.limits)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
