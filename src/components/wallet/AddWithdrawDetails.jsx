import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Landmark, Bitcoin, CreditCard, ArrowLeft, Save, Info, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AddWithdrawDetails({ onBack }) {
    const { t } = useTranslation();
    const [activeMethod, setActiveMethod] = useState('bank');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const [message, setMessage] = useState('');

    // Bank Form State
    const [bankData, setBankData] = useState({
        providerName: '',
        accountName: '',
        accountNumber: '',
        routingNumber: '',
        isDefault: true
    });

    // Crypto Form State
    const [cryptoData, setCryptoData] = useState({
        providerName: '',
        accountName: '',
        accountNumber: '',
        network: 'TRC20'
    });

    const handleSave = async () => {
        setLoading(true);
        setStatus(null);
        setMessage('');

        const token = localStorage.getItem('portalToken');
        const payload = activeMethod === 'bank' 
            ? { ...bankData, type: 'BANK' }
            : { ...cryptoData, type: 'CRYPTO' };

        try {
            const response = await fetch('https://v3.livefxhub.com:8444/api/financial/payment-methods', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                setStatus('success');
                setMessage(t('Payment method saved successfully!'));
                // Reset forms
                if (activeMethod === 'bank') setBankData({ providerName: '', accountName: '', accountNumber: '', routingNumber: '', isDefault: true });
                else setCryptoData({ providerName: '', accountName: '', accountNumber: '', network: 'TRC20' });
                
                // Close after delay
                setTimeout(() => onBack(), 2000);
            } else {
                setStatus('error');
                setMessage(result.message || t('Failed to save payment method.'));
            }
        } catch (error) {
            setStatus('error');
            setMessage(t('Network error. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-details-container animate-fadeIn">
            <button className="deposit-back-btn" onClick={onBack} style={{ marginBottom: '12px' }}>
                <ArrowLeft size={18} />
                <span>{t('Back')}</span>
            </button>

            <div className="payment-view-header" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{t('Add Withdraw Details')}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                    {t('Save your account details for faster future withdrawals.')}
                </p>
            </div>

            <div className="withdraw-method-tabs">
                <button 
                    className={`method-tab ${activeMethod === 'bank' ? 'active' : ''}`}
                    onClick={() => { setActiveMethod('bank'); setStatus(null); }}
                >
                    <Landmark size={18} />
                    {t('Bank Account')}
                </button>
                <button 
                    className={`method-tab ${activeMethod === 'crypto' ? 'active' : ''}`}
                    onClick={() => { setActiveMethod('crypto'); setStatus(null); }}
                >
                    <Bitcoin size={18} />
                    {t('Crypto Wallet')}
                </button>
                <button 
                    className={`method-tab ${activeMethod === 'other' ? 'active' : ''}`}
                    onClick={() => { setActiveMethod('other'); setStatus(null); }}
                >
                    <CreditCard size={18} />
                    {t('Other Methods')}
                </button>
            </div>

            <div className="details-form-wrapper" style={{ background: 'var(--surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                {status && (
                    <div className={`kyc-status-alert ${status}`} style={{ marginBottom: '24px', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                        {status === 'success' ? <CheckCircle size={20} color="#10b981" /> : <AlertCircle size={20} color="#ef4444" />}
                        <span style={{ color: status === 'success' ? '#10b981' : '#ef4444', fontWeight: '600' }}>{message}</span>
                    </div>
                )}

                {activeMethod === 'bank' && (
                    <div className="details-form">
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div className="form-group-wallet">
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    {t('Bank Name')}
                                </label>
                                <input 
                                    type="text" 
                                    className="wallet-input" 
                                    placeholder={t('e.g. Chase Bank')} 
                                    value={bankData.providerName}
                                    onChange={(e) => setBankData({...bankData, providerName: e.target.value})}
                                />
                            </div>
                            <div className="form-group-wallet">
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    {t('Account Holder Name')}
                                </label>
                                <input 
                                    type="text" 
                                    className="wallet-input" 
                                    placeholder={t('Your full name')} 
                                    value={bankData.accountName}
                                    onChange={(e) => setBankData({...bankData, accountName: e.target.value})}
                                />
                            </div>
                            <div className="form-group-wallet">
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    {t('Account Number')}
                                </label>
                                <input 
                                    type="text" 
                                    className="wallet-input" 
                                    placeholder={t('Enter account number')} 
                                    value={bankData.accountNumber}
                                    onChange={(e) => setBankData({...bankData, accountNumber: e.target.value})}
                                />
                            </div>
                            <div className="form-group-wallet">
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    {t('Routing Number')}
                                </label>
                                <input 
                                    type="text" 
                                    className="wallet-input" 
                                    placeholder={t('Enter routing number')} 
                                    value={bankData.routingNumber}
                                    onChange={(e) => setBankData({...bankData, routingNumber: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeMethod === 'crypto' && (
                    <div className="details-form">
                         <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div className="form-group-wallet">
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    {t('Exchange / Wallet Provider')}
                                </label>
                                <input 
                                    type="text" 
                                    className="wallet-input" 
                                    placeholder={t('e.g. Binance, Trust Wallet')} 
                                    value={cryptoData.providerName}
                                    onChange={(e) => setCryptoData({...cryptoData, providerName: e.target.value})}
                                />
                            </div>
                            <div className="form-group-wallet">
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    {t('Wallet Label')}
                                </label>
                                <input 
                                    type="text" 
                                    className="wallet-input" 
                                    placeholder={t('e.g. My Primary Wallet')} 
                                    value={cryptoData.accountName}
                                    onChange={(e) => setCryptoData({...cryptoData, accountName: e.target.value})}
                                />
                            </div>
                            <div className="form-group-wallet">
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    {t('Network')}
                                </label>
                                <select 
                                    className="wallet-input"
                                    value={cryptoData.network}
                                    onChange={(e) => setCryptoData({...cryptoData, network: e.target.value})}
                                >
                                    <option value="TRC20">TRON (TRC20)</option>
                                    <option value="ERC20">Ethereum (ERC20)</option>
                                    <option value="BEP20">Binance Smart Chain (BEP20)</option>
                                </select>
                            </div>
                            <div className="form-group-wallet">
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    {t('Wallet Address')}
                                </label>
                                <input 
                                    type="text" 
                                    className="wallet-input" 
                                    placeholder={t('Enter wallet address')} 
                                    value={cryptoData.accountNumber}
                                    onChange={(e) => setCryptoData({...cryptoData, accountNumber: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeMethod === 'other' && (
                    <div className="coming-soon-container" style={{ padding: '60px 0', textAlign: 'center' }}>
                         <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                             <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <CreditCard size={32} color="var(--primary)" />
                             </div>
                         </div>
                         <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>{t('Coming Soon')}</h3>
                         <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>
                             {t('We are working on bringing more payment methods to you.')}
                         </p>
                    </div>
                )}

                {activeMethod !== 'other' && (
                    <div className="form-actions" style={{ marginTop: '32px' }}>
                        <button 
                            className={`kyc-primary-btn ${loading ? 'loading' : ''}`} 
                            style={{ maxWidth: '240px', height: '44px' }}
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="spin" size={20} /> : (
                                <>
                                    <Save size={18} style={{ marginRight: '8px' }} />
                                    {t('Save Details')}
                                </>
                            )}
                        </button>
                    </div>
                )}
                
                {activeMethod !== 'other' && (
                    <div className="info-badge" style={{ marginTop: '24px', background: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                        <Info size={16} />
                        <span>{t('All withdrawal details are encrypted and stored securely.')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
