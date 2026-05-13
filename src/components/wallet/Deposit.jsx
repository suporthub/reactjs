import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bitcoin, Landmark, Wallet, ArrowLeft, RefreshCw, ArrowRightLeft, Check, AlertCircle, Loader2 } from 'lucide-react';
import VietnamDeposit from './VietnamDeposit';
import CryptoDeposit from './CryptoDeposit';
import OtherPaymentDeposit from './OtherPaymentDeposit';

export default function Deposit() {
    const { t } = useTranslation();
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [transferAccounts, setTransferAccounts] = useState([]);
    const [fromAccount, setFromAccount] = useState('');
    const [toAccount, setToAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferResult, setTransferResult] = useState(null);
    const [transferError, setTransferError] = useState('');

    const userDataStr = localStorage.getItem('userData');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const countryCode = userData?.countryCode || userData?.country || '';

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
        ...(countryCode === 'VN' ? [{
            id: 'vietnam-deposit',
            name: 'Vietnam Deposit',
            icon: Landmark,
            color: '#10b981', // Emerald Green
            processing: 'Instant - 1 hour',
            fee: '0%',
            limits: '100 - 100,000 USD'
        }] : []),
        {
            id: 'other-payment',
            name: 'Other Payment Option',
            icon: Wallet,
            color: '#3b82f6', // Royal Blue
            processing: 'Instant',
            fee: '0%',
            limits: '10 - 50,000 USD'
        },
        {
            id: 'internal-transfer',
            name: 'Internal Transfer',
            icon: RefreshCw,
            color: '#8b5cf6', // Violet/Purple
            processing: 'Instant',
            fee: '0%',
            limits: '1 - 1,000,000 USD'
        }
    ];

    const fetchTransferAccounts = async () => {
        setTransferLoading(true);
        const token = localStorage.getItem('portalToken');
        const fingerprint = localStorage.getItem('deviceFingerprint');
        try {
            const response = await fetch('https://v3.livefxhub.com:8444/api/live/accounts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Device-Fingerprint': fingerprint
                }
            });
            const result = await response.json();
            if (result.success) {
                setTransferAccounts(result.data || []);
            }
        } catch (error) {
            console.error("Fetch accounts for transfer failed:", error);
        } finally {
            setTransferLoading(false);
            setShowTransferForm(true);
        }
    };

    // Auto-fetch accounts when internal transfer is selected
    React.useEffect(() => {
        if (selectedMethod === 'internal-transfer' && !showTransferForm && !transferLoading) {
            fetchTransferAccounts();
        }
    }, [selectedMethod]);

    const handleConfirmTransfer = async () => {
        if (!fromAccount || !toAccount || !amount) {
            setTransferError(t('Please select accounts and enter an amount.'));
            return;
        }

        setTransferLoading(true);
        setTransferError('');

        // Find the full account objects to get their IDs
        const fromAccObj = transferAccounts.find(a => a.accountNumber === fromAccount);
        const toAccObj = transferAccounts.find(a => a.accountNumber === toAccount);

        // For this specific API, we need the UUIDs
        // Note: fromAccount is accountNumber from dropdown, but payload needs UUID (id)
        const payload = {
            fromAccountId: fromAccObj?.id || fromAccount,
            toAccountId: toAccObj?.id || toAccount,
            amount: parseFloat(amount),
            currency: fromAccObj?.currency || 'USD',
            description: `Transfer from ${fromAccount} to ${toAccount}`
        };

        const token = localStorage.getItem('portalToken');

        try {
            const response = await fetch('https://v3.livefxhub.com:8444/api/financial/transfers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                setTransferResult(result.data);
                // Refresh accounts after transfer
                fetchTransferAccounts();
            } else {
                setTransferError(result.message || t('Transfer failed'));
            }
        } catch (error) {
            console.error("Transfer execution failed:", error);
            setTransferError(t('Network error. Please try again.'));
        } finally {
            setTransferLoading(false);
        }
    };

    if (selectedMethod) {
        const method = depositMethods.find(m => m.id === selectedMethod);
        return (
            <div className="wallet-tab-content">
                <div className="payment-view-container">
                    <button className="deposit-back-btn" onClick={() => {
                        setSelectedMethod(null);
                        setShowTransferForm(false);
                    }}>
                        <ArrowLeft size={18} />
                        <span>{t('Back')}</span>
                    </button>

                    <div className="payment-view-header">
                        <h2>{t('Deposit via')} {t(method.name)}</h2>
                    </div>

                    {method.id === 'vietnam-deposit' && <VietnamDeposit />}
                    {method.id === 'crypto' && <CryptoDeposit />}
                    {method.id === 'other-payment' && <OtherPaymentDeposit />}
                    {method.id === 'internal-transfer' && (
                        transferLoading && !showTransferForm ? (
                            <div className="transfer-loading-container">
                                <Loader2 className="spin" size={48} color="#8b5cf6" />
                                <p>{t('Loading your accounts...')}</p>
                            </div>
                        ) : transferResult ? (
                            <div className="transfer-success-container">
                                <div className="success-icon-circle">
                                    <Check size={48} color="#10b981" />
                                </div>
                                <h3>{t('Transfer Successful')}</h3>
                                <p>{t('Your funds have been moved successfully.')}</p>
                                
                                <div className="transfer-summary-box">
                                    <div className="summary-row">
                                        <span>{t('Source Balance After')}</span>
                                        <strong>${transferResult.debitTxn?.balanceAfter?.toFixed(2)}</strong>
                                    </div>
                                    <div className="summary-row">
                                        <span>{t('Destination Balance After')}</span>
                                        <strong>${transferResult.creditTxn?.balanceAfter?.toFixed(2)}</strong>
                                    </div>
                                </div>

                                <button 
                                    className="kyc-primary-btn" 
                                    style={{ marginTop: '24px', width: '100%' }}
                                    onClick={() => {
                                        setTransferResult(null);
                                        setAmount('');
                                    }}
                                >
                                    {t('Make Another Transfer')}
                                </button>
                            </div>
                        ) : (
                            <div className="transfer-form-container">
                                {transferError && (
                                    <div className="kyc-status-alert error" style={{ marginBottom: '16px' }}>
                                        <AlertCircle size={18} />
                                        <span>{transferError}</span>
                                    </div>
                                )}
                                <div className="transfer-row-grid">
                                    <div className="form-group-wallet">
                                        <label>{t('From Account')}</label>
                                        <select 
                                            className="wallet-input"
                                            value={fromAccount}
                                            onChange={(e) => setFromAccount(e.target.value)}
                                        >
                                            <option value="">{t('Select Source')}</option>
                                            {transferAccounts.map(acc => (
                                                <option key={`from-${acc.accountNumber}`} value={acc.accountNumber}>
                                                    {acc.accountName} (#{acc.accountNumber}) - ${acc.walletBalance || acc.balance || '0.00'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="transfer-arrow-horizontal">
                                        <ArrowRightLeft size={16} />
                                    </div>

                                    <div className="form-group-wallet">
                                        <label>{t('To Account')}</label>
                                        <select 
                                            className="wallet-input"
                                            value={toAccount}
                                            onChange={(e) => setToAccount(e.target.value)}
                                        >
                                            <option value="">{t('Select Destination')}</option>
                                            {transferAccounts.map(acc => (
                                                <option 
                                                    key={`to-${acc.accountNumber}`} 
                                                    value={acc.accountNumber}
                                                    disabled={fromAccount === acc.accountNumber}
                                                >
                                                    {acc.accountName} (#{acc.accountNumber}) - ${acc.walletBalance || acc.balance || '0.00'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group-wallet" style={{ marginTop: '20px' }}>
                                    <label>{t('Amount to Transfer')}</label>
                                    <input 
                                        type="number" 
                                        className="wallet-input" 
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>

                                <button 
                                    className={`primary-wallet-btn ${transferLoading ? 'loading' : ''}`}
                                    style={{ marginTop: '24px' }}
                                    onClick={handleConfirmTransfer}
                                    disabled={transferLoading}
                                >
                                    {transferLoading ? <Loader2 className="spin" size={20} /> : t('Confirm Transfer')}
                                </button>
                            </div>
                        )
                    )}</div>
            </div>
        );
    }

    return (
        <div className="wallet-tab-content">
            <div className="payment-view-container">
                <div className="payment-view-header">
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
