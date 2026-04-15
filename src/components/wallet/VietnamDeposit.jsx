import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Pin, RefreshCcw, Save, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { getDeviceFingerprint } from '../../utils/fingerprint';
import { getAccounts } from '../../utils/accountsCache';

export default function VietnamDeposit() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        amount: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Account selection state
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [accountOptions, setAccountOptions] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
    const accountDropdownRef = useRef(null);

    useEffect(() => {
        const loadAccounts = async () => {
            const accounts = await getAccounts();
            if (accounts.length > 0) {
                setAccountOptions(accounts);
                setSelectedAccountId(accounts[0].id);
            }
            setAccountsLoading(false);
        };
        loadAccounts();

        const handleClickOutside = (event) => {
            if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
                setAccountDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeposit = async (e) => {
        // Prevent form submission if button is within a form
        e?.preventDefault();

        const amountNum = parseFloat(formData.amount);

        if (!selectedAccountId) {
            setError(t('Please select an account'));
            return;
        }

        if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
            setError(t('Please enter a valid positive amount'));
            return;
        }

        setError(null);

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
                    tradingAccountId: selectedAccountId
                })
            });

            const result = await response.json();

            // Handle standard success patterns and the specific URL return
            if (result.success || result.status === 'success' || result.data?.url || result.url || result.paymentUrl || result.data?.paymentUrl) {
                const redirectUrl = result.paymentUrl || result.data?.paymentUrl || result.url || result.data?.url;
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
                    console.error("No redirect URL found in response", result);
                    setError(t('Payment initialization failed: No redirect URL found.'));
                }
            } else if (response.status === 401) {
                // Should be handled by apiInterceptor, but adding safety here
                setError(t('Your session has expired. Please log in again.'));
            } else {
                console.error("API error status:", response.status, result);
                setError(result.message || t('Something went wrong. Please try again.'));
            }
        } catch (err) {
            console.error("Deposit request failed:", err);
            setError(t('Request failed. Please check your connection.'));
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
                {/* Select Account Dropdown */}
                <div className="form-group-wallet crypto-custom-select-container" ref={accountDropdownRef}>
                    <label>{t('Select Account')}</label>
                    <div
                        className={`crypto-select-btn ${accountDropdownOpen ? 'active' : ''} ${selectedAccountId ? 'has-value' : ''}`}
                        onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                    >
                        {selectedAccountId ? (
                            <div className="crypto-select-value">
                                <span>{accountOptions.find(a => a.id === selectedAccountId)?.accountNumber || ''}</span>
                            </div>
                        ) : (
                            <div className="crypto-select-placeholder">
                                {accountsLoading ? t('Loading accounts...') : t('Select Account')}
                            </div>
                        )}
                        <ChevronDown size={18} className={`crypto-chevron ${accountDropdownOpen ? 'open' : ''}`} />
                    </div>
                    {accountDropdownOpen && (
                        <div className="crypto-dropdown-menu">
                            {accountOptions.map((acc) => (
                                <div
                                    key={acc.id}
                                    className={`crypto-dropdown-item ${acc.id === selectedAccountId ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSelectedAccountId(acc.id);
                                        setAccountDropdownOpen(false);
                                    }}
                                >
                                    <span>{acc.accountNumber}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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

                {error && (
                    <div className="wallet-deposit-error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

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
