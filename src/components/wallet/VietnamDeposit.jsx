import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Pin, RefreshCcw, Save, Loader2 } from 'lucide-react';
import { getDeviceFingerprint } from '../../utils/fingerprint';

export default function VietnamDeposit() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        amount: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    const handleDeposit = async (e) => {
        // Prevent form submission if button is within a form
        e?.preventDefault();

        const amountNum = parseFloat(formData.amount);
        
        if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
            alert(t('Please enter a valid positive amount'));
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('portalToken');
            const fingerprint = await getDeviceFingerprint();
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');

            // According to USER_REQUEST: https://v3.livefxhub.com:8444/api/payments/pay2pay/redirect
            const response = await fetch('https://v3.livefxhub.com:8444/api/payments/pay2pay/redirect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'fingerprint': fingerprint
                },
                body: JSON.stringify({
                    amountVnd: amountNum,
                    description: formData.description || `Deposit for account ${userData.id || 'User'}`
                })
            });

            const result = await response.json();

            // Handle standard success patterns and the specific URL return
            if (result.success || result.status === 'success' || result.data?.url || result.url) {
                const redirectUrl = result.url || result.data?.url;
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
                    console.error("No redirect URL found in response", result);
                    alert(t('Payment initialization failed: No redirect URL found.'));
                }
            } else if (response.status === 401) {
                // Should be handled by apiInterceptor, but adding safety here
                alert(t('Your session has expired. Please log in again.'));
            } else {
                console.error("API error status:", response.status, result);
                alert(result.message || t('Something went wrong. Please try again.'));
            }
        } catch (error) {
            console.error("Deposit request failed:", error);
            alert(t('Request failed. Please check your connection.'));
        } finally {
            setLoading(false);
        }
    };

    // Prevent negative and 'e' characters in number input
    const handleKeyDown = (e) => {
        if (e.key === '-' || e.key === 'e' || e.key === '+') {
            e.preventDefault();
        }
    };

    return (
        <div className="deposit-form-split-layout">
            <div className="deposit-form-left text-fields-wrapper">
                <div className="form-group-wallet">
                    <label>{t('Amount')}</label>
                    <div className="input-with-label-wrapper">
                        <input 
                            type="number" 
                            placeholder={t('Enter amount to deposit')} 
                            className="wallet-input"
                            min="0"
                            step="any"
                            onKeyDown={handleKeyDown}
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="form-group-wallet">
                    <label>{t('Description (Optional)')}</label>
                    <input 
                        type="text" 
                        placeholder={t('Enter description')} 
                        className="wallet-input" 
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <button 
                    className="primary-wallet-btn" 
                    onClick={handleDeposit}
                    disabled={loading}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px',
                        opacity: loading ? 0.7 : 1 
                    }}
                >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? t('Processing...') : t('Deposit')}
                </button>
            </div>

            <div className="deposit-form-right extra-info-wrapper">
                <div className="deposit-note-card">
                    <div className="note-header">
                        <Info size={16} />
                        <span>{t('NOTE')}</span>
                    </div>
                    <div className="note-list">
                        <div className="note-item">
                            < Pin size={16} className="note-icon-pin" />
                            <span>{t('Exchange Rate:')} <strong>1 USD = 26,976.97 VND</strong></span>
                        </div>
                        <div className="note-item">
                            <RefreshCcw size={16} className="note-icon-refresh" />
                            <span>{t('If you have made an')} <span className="highlight-orange">{t('overpayment')}</span> {t('or')} <span className="highlight-orange">{t('underpayment')}</span>, {t('the amount will be automatically returned to you within 7 days.')}</span>
                        </div>
                        <div className="note-item">
                            <Save size={16} className="note-icon-save" />
                            <span>{t('After a successful payment, please')} <span className="highlight-green">{t('save the transaction ID')}</span> {t('for your future reference and support.')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

