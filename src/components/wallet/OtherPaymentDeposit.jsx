import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { getAccounts } from '../../utils/accountsCache';

export default function OtherPaymentDeposit() {
    const { t } = useTranslation();
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
                    <label>{t('Amount (USD)')}</label>
                    <input type="number" placeholder={t('Enter amount to deposit')} className="wallet-input" />
                </div>

                <div className="form-group-wallet">
                    <label>{t('Description (Optional)')}</label>
                    <input type="text" placeholder={t('Enter description')} className="wallet-input" />
                </div>

                <button className="primary-wallet-btn">
                    {t('Deposit')}
                </button>
            </div>

            <div className="deposit-form-right extra-info-wrapper">
                {/* Specific notes for other payment methods can go here later if needed */}
            </div>
        </div>
    );
}
