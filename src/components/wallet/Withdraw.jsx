import React from 'react';
import { Bitcoin, Landmark, CreditCard, Smartphone, Wallet, Info } from 'lucide-react';

export default function Withdraw() {
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
        {
            id: 'cards',
            name: 'Debit and Credit Card',
            icon: CreditCard,
            color: '#2563eb',
            processing: 'Instant - 24 hours',
            fee: '0.00%',
            limits: '10 - 5,000 USD'
        },
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

    return (
        <div className="wallet-tab-content">
            <div className="withdraw-view-container">
                {/* Balance Summary Card */}
                <div className="balance-overview-card">
                    <div className="balance-left">
                        <div className="total-label">Available for Withdrawal</div>
                        <div className="total-amount">$5,240.00</div>
                        <div className="balance-stats">
                            <div className="stat">
                                <span className="stat-label">Total Balance:</span>
                                <span className="stat-value">$12,850.40</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">In Orders:</span>
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
                    <h2>Withdrawal Methods</h2>
                    <div className="info-badge">
                        <Info size={14} />
                        <span>Withdrawals are processed according to the sequence of deposits.</span>
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
                                    <div className="withdrawal-method-name">{method.name}</div>
                                    <div className="withdrawal-method-processed">Processed within {method.processing}</div>
                                </div>
                            </div>

                            <div className="item-meta">
                                <div className="meta-group">
                                    <span className="label">Fee:</span>
                                    <span className="value free">{method.fee}</span>
                                </div>
                                <div className="meta-group">
                                    <span className="label">Limits:</span>
                                    <span className="value">{method.limits}</span>
                                </div>
                            </div>

                            <button className="withdraw-btn-action">
                                Withdraw
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
