import React from 'react';
import { Bitcoin, Landmark, CreditCard, Smartphone } from 'lucide-react';

export default function Deposit() {
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
            id: 'bank-transfer',
            name: 'Bank Transfer',
            icon: Landmark,
            color: '#4b5563', // Professional Slate
            processing: '1 - 3 business days',
            fee: '0%',
            limits: '100 - 100,000 USD'
        },
        {
            id: 'cards',
            name: 'Debit and Credit Card',
            icon: CreditCard,
            color: '#2563eb', // Visa/Mastercard Blue
            processing: 'Instant',
            fee: '0%',
            limits: '10 - 5,000 USD'
        },
        {
            id: 'upi',
            name: 'UPI',
            icon: Smartphone,
            color: '#6366f1', // UPI/PhonePe Indigo
            processing: 'Instant',
            fee: '0%',
            limits: '10 - 2,000 USD'
        }
    ];

    return (
        <div className="wallet-tab-content">
            <div className="payment-view-container">
                <div className="payment-view-header">
                    <h2>Deposit</h2>
                    <p>All payment methods</p>
                </div>

                <div className="payment-methods-grid">
                    {depositMethods.map((method) => (
                        <div key={method.id} className="payment-method-card">
                            <div className="card-top">
                                <div className="method-identity">
                                    <div className="method-icon-circle" style={{ color: method.color, backgroundColor: `${method.color}15` }}>
                                        <method.icon size={22} />
                                    </div>
                                    <span className="method-name">{method.name}</span>
                                </div>
                                {method.recommended && <span className="recommended-badge">Recommended</span>}
                            </div>

                            <div className="card-details">
                                <div className="detail-row">
                                    <span className="label">Processing time</span>
                                    <span className="value">{method.processing}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Fee</span>
                                    <span className="value">{method.fee}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Limits</span>
                                    <span className="value">{method.limits}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
