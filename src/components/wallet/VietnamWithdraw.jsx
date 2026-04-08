import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Landmark, User, CreditCard, DollarSign, Wallet, ChevronDown } from 'lucide-react';

const VIETNAM_BANKS = [
    { id: 'vcb', name: 'Vietcombank' },
    { id: 'tcb', name: 'Techcombank' },
    { id: 'bidv', name: 'BIDV' },
    { id: 'vtb', name: 'VietinBank' },
    { id: 'agr', name: 'Agribank' },
    { id: 'vpb', name: 'VPBank' },
    { id: 'mb', name: 'MB Bank' },
    { id: 'acb', name: 'ACB' },
    { id: 'stb', name: 'Sacombank' },
    { id: 'tpb', name: 'TPBank' }
];

export default function VietnamWithdraw() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        bank: '',
        accountNumber: '',
        holderName: '',
        amount: '',
        tradingAccount: ''
    });

    const [tradingAccounts, setTradingAccounts] = useState([]);
    const [showBankDropdown, setShowBankDropdown] = useState(false);
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);

    useEffect(() => {
        // Mock fetching trading accounts - in real app, these would come from an API or global state
        const savedAccounts = localStorage.getItem('tradingAccounts');
        if (savedAccounts) {
            setTradingAccounts(JSON.parse(savedAccounts));
        } else {
            // Fallback mock
            setTradingAccounts([
                { accountNumber: '8810234', balance: 5240.00, accountType: 'live' },
                { accountNumber: '8810567', balance: 1250.40, accountType: 'live' }
            ]);
        }
    }, []);

    const handleWithdraw = (e) => {
        e.preventDefault();
        console.log('Withdrawal request:', formData);
        // Add withdrawal logic here
    };

    return (
        <div className="deposit-form-split-layout">
            <div className="deposit-form-left text-fields-wrapper">
                <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Bank Selection Dropdown */}
                    <div className="form-group-wallet">
                        <label>{t('Select bank')}</label>
                        <div className="crypto-custom-select-container">
                            <div 
                                className={`crypto-select-btn ${showBankDropdown ? 'active' : ''}`}
                                onClick={() => setShowBankDropdown(!showBankDropdown)}
                            >
                                <div className="crypto-select-value">
                                    <Landmark size={20} className="crypto-select-icon" />
                                    {formData.bank ? VIETNAM_BANKS.find(b => b.id === formData.bank)?.name : <span className="crypto-select-placeholder">{t('Select a bank')}</span>}
                                </div>
                                <ChevronDown size={18} className={`crypto-chevron ${showBankDropdown ? 'open' : ''}`} />
                            </div>
                            
                            {showBankDropdown && (
                                <div className="crypto-dropdown-menu">
                                    {VIETNAM_BANKS.map(bank => (
                                        <div 
                                            key={bank.id} 
                                            className={`crypto-dropdown-item ${formData.bank === bank.id ? 'selected' : ''}`}
                                            onClick={() => {
                                                setFormData({ ...formData, bank: bank.id });
                                                setShowBankDropdown(false);
                                            }}
                                        >
                                            <Landmark size={18} />
                                            <span>{bank.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bank Account Number */}
                    <div className="form-group-wallet">
                        <label>{t('Bank ref number')}</label>
                        <div className="input-with-icon-wrapper" style={{ position: 'relative' }}>
                            <CreditCard size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder={t('Enter bank ref number')} 
                                className="wallet-input" 
                                style={{ paddingLeft: '48px' }}
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Bank Holder Name */}
                    <div className="form-group-wallet">
                        <label>{t('Bank ref name')}</label>
                        <div className="input-with-icon-wrapper" style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder={t('Enter bank ref name')} 
                                className="wallet-input" 
                                style={{ paddingLeft: '48px' }}
                                value={formData.holderName}
                                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="form-group-wallet">
                        <label>{t('Amount')}</label>
                        <div className="input-with-icon-wrapper" style={{ position: 'relative' }}>
                            <DollarSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="number" 
                                placeholder={t('Enter amount to withdraw')} 
                                className="wallet-input" 
                                style={{ paddingLeft: '48px' }}
                                min="0"
                                onKeyDown={(e) => (e.key === '-' || e.key === 'e' || e.key === '+') && e.preventDefault()}
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Trading Account Dropdown */}
                    <div className="form-group-wallet">
                        <label>{t('Withdrawal from account')}</label>
                        <div className="crypto-custom-select-container">
                            <div 
                                className={`crypto-select-btn ${showAccountDropdown ? 'active' : ''}`}
                                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                            >
                                <div className="crypto-select-value">
                                    <Wallet size={20} className="crypto-select-icon" />
                                    {formData.tradingAccount ? 
                                        `${formData.tradingAccount} ($${tradingAccounts.find(a => a.accountNumber === formData.tradingAccount)?.balance.toLocaleString()})` : 
                                        <span className="crypto-select-placeholder">{t('Select trading account')}</span>
                                    }
                                </div>
                                <ChevronDown size={18} className={`crypto-chevron ${showAccountDropdown ? 'open' : ''}`} />
                            </div>
                            
                            {showAccountDropdown && (
                                <div className="crypto-dropdown-menu">
                                    {tradingAccounts.map(acc => (
                                        <div 
                                            key={acc.accountNumber} 
                                            className={`crypto-dropdown-item ${formData.tradingAccount === acc.accountNumber ? 'selected' : ''}`}
                                            onClick={() => {
                                                setFormData({ ...formData, tradingAccount: acc.accountNumber });
                                                setShowAccountDropdown(false);
                                            }}
                                        >
                                            <Wallet size={18} />
                                            <span>{acc.accountNumber} ({acc.accountType}) - ${acc.balance.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="primary-wallet-btn">
                        {t('Withdraw')}
                    </button>
                </form>
            </div>

            <div className="deposit-form-right extra-info-wrapper">
                <div className="deposit-note-card" style={{ borderLeftColor: '#10b981' }}>
                    <div className="note-header" style={{ color: '#10b981' }}>
                        <Info size={18} />
                        <span>{t('Vietnam Withdrawal Info:')}</span>
                    </div>
                    <div className="note-list">
                        <div className="note-item">
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginTop: '7px' }}></div>
                            <span>{t('Exchange Rate:')} <strong>1 USD = 25493.32 VND</strong></span>
                        </div>
                        <div className="note-item">
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginTop: '7px' }}></div>
                            <span>{t('No 3rd party withdrawals accepted')}</span>
                        </div>
                        <div className="note-item">
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginTop: '7px' }}></div>
                            <span>{t('Please verify your Bank details before confirming')}</span>
                        </div>
                        <div className="note-item">
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginTop: '7px' }}></div>
                            <span>{t('We are not responsible for incorrect account details')}</span>
                        </div>
                        <div className="note-item">
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginTop: '7px' }}></div>
                            <span>{t('Ensure the account belongs to your registered name')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
