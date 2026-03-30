import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './accounts.css';
import '../auth/login.css'; // Added for OTP modal styling
import {
    Plus, ChevronDown, LayoutGrid, List, ArrowDownToLine,
    ArrowUpToLine, MoreVertical, Info, X, DollarSign, Zap, ShieldCheck, Wallet,
    CreditCard, Globe, Settings, Lock, Target, FileDown, ArrowRightLeft, Copy
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Accounts() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Live'); // Changed 'Real' to 'Live'
    const [viewMode, setViewMode] = useState('list');
    const [accounts, setAccounts] = useState([]);

    // Account Creation Wizard States
    const [showModal, setShowModal] = useState(false);
    const [step, setStep] = useState(1); // 1: Type Selection, 2: Form
    const [accountType, setAccountType] = useState(null); // 'live' or 'demo'
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // OTP Modal States
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otpSuccess, setOtpSuccess] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpInputRefs = React.useRef([]);

    const [formData, setFormData] = useState({
        accountName: '',
        group: 'Demo',
        accountVariant: 'usd',
        initialBalance: 10000
    });

    // Custom Select States
    const [showGroupDropdown, setShowGroupDropdown] = useState(false);
    const [showVariantDropdown, setShowVariantDropdown] = useState(false);
    const groupDropdownRef = React.useRef(null);
    const variantDropdownRef = React.useRef(null);
    const menuRef = React.useRef(null);
    const [openMenuAccountId, setOpenMenuAccountId] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedAccountForInfo, setSelectedAccountForInfo] = useState(null);

    const hasFetched = React.useRef(false);

    const fetchAccounts = async () => {
        const token = localStorage.getItem('portalToken');
        const fingerprint = localStorage.getItem('deviceFingerprint');

        if (!token) return;

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
                setAccounts(result.data || []);
                localStorage.setItem('accounts', JSON.stringify(result.data || []));
            }
        } catch (error) {
            console.error("Fetch accounts failed:", error);
        }
    };

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchAccounts();
        }

        const handleRefresh = () => {
            fetchAccounts();
        };

        window.addEventListener('refreshAccountsData', handleRefresh);
        return () => window.removeEventListener('refreshAccountsData', handleRefresh);
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target)) {
                setShowGroupDropdown(false);
            }
            if (variantDropdownRef.current && !variantDropdownRef.current.contains(event.target)) {
                setShowVariantDropdown(false);
            }
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuAccountId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const copyAccountNumber = async (accountNumber) => {
        const value = String(accountNumber || '').trim();
        if (!value) return;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(value);
                return;
            }
        } catch (error) {
            console.error('Clipboard API copy failed:', error);
        }

        try {
            const textArea = document.createElement('textarea');
            textArea.value = value;
            textArea.setAttribute('readonly', '');
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            textArea.style.pointerEvents = 'none';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        } catch (error) {
            console.error('Fallback copy failed:', error);
        }
    };

    const handleOpenWizard = () => {
        setShowModal(true);
        setStep(1);
        setFormError('');
    };

    const handleSelectType = (type) => {
        setAccountType(type);
        setStep(2);
        // Reset defaults based on type
        if (type === 'demo') {
            setFormData(prev => ({ ...prev, group: 'Demo', accountName: '' }));
        } else {
            setFormData(prev => ({ ...prev, group: 'Standard', accountName: '' }));
        }
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        const token = localStorage.getItem('portalToken');
        const fingerprint = localStorage.getItem('deviceFingerprint');

        const endpoint = accountType === 'live'
            ? 'https://v3.livefxhub.com:8444/api/live/accounts'
            : 'https://v3.livefxhub.com:8444/api/live/accounts/demo';

        try {
            const bodyPayload = accountType === 'live'
                ? {
                    accountName: formData.accountName,
                    group: formData.group,
                    accountVariant: formData.accountVariant,
                    currency: "USD",
                    leverage: 100
                }
                : {
                    accountName: formData.accountName,
                    group: "Demo", // Forced for Demo based on updated requirement
                    accountVariant: formData.accountVariant,
                    initialBalance: Number(formData.initialBalance) || 10000,
                    currency: "USD",
                    leverage: 100
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Device-Fingerprint': fingerprint
                },
                body: JSON.stringify(bodyPayload)
            });

            const result = await response.json();

            if (result.success) {
                setShowModal(false);
                setStep(1);
                setAccountType(null);
                setFormData({ accountName: '', group: 'Demo', accountVariant: 'usd', initialBalance: 10000 });
                fetchAccounts(); // Refresh the list
            } else if (result.code === 'EMAIL_NOT_VERIFIED') {
                setFormError(result.message);
                handleSendOtp();
            } else {
                setFormError(result.message || 'Account creation failed');
            }
        } catch (err) {
            setFormError('Connection failed. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleSendOtp = async () => {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const email = userData.email;
        if (!email) {
            setFormError("Email not found in profile.");
            return;
        }

        try {
            setFormLoading(true);
            const response = await fetch('https://v3.livefxhub.com:8444/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, purpose: 'email_verify' })
            });
            const data = await response.json();
            if (data.success) {
                setShowModal(false);
                setShowOtpModal(true);
                setOtp(['', '', '', '', '', '']);
                setOtpError('');
                setOtpSuccess('Verification code sent! Please check your email.');
                setResendCooldown(120); // 2 minutes cooldown on success
            } else {
                setFormError(data.message || 'Failed to send OTP.');
            }
        } catch (e) {
            setFormError('Network error while sending OTP.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;

        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const email = userData.email;
        if (!email) return;

        setOtpError('');
        setOtpSuccess('');
        try {
            const response = await fetch('https://v3.livefxhub.com:8444/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, purpose: 'email_verify' })
            });
            const data = await response.json();
            if (data.success) {
                setOtpSuccess('Verification code resent successfully!');
                setResendCooldown(120);
            } else {
                setOtpError(data.message || 'Failed to resend OTP.');
            }
        } catch (err) {
            setOtpError('Network error while resending OTP.');
        }
    };

    const handleVerifyOtp = async () => {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const email = userData.email;
        const otpCode = otp.join('');

        if (otpCode.length !== 6) {
            setOtpError('Please enter a valid 6-digit OTP.');
            return;
        }

        try {
            setOtpLoading(true);
            const response = await fetch('https://v3.livefxhub.com:8444/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpCode })
            });
            const data = await response.json();
            if (data.success) {
                setShowOtpModal(false);
                setFormError(''); // Clear error on the parent modal!
                setShowModal(true); // Bring back the account creation wizard
            } else {
                setOtpError(data.message || 'Invalid OTP.');
            }
        } catch (e) {
            setOtpError('Network error while verifying OTP.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^[0-9]?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5 && otpInputRefs.current[index + 1]) {
            otpInputRefs.current[index + 1].focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0 && otpInputRefs.current[index - 1]) {
            otpInputRefs.current[index - 1].focus();
        }
    };

    // Filter accounts based on activeTab
    const filteredAccounts = accounts.filter(acc =>
        acc.type === activeTab.toLowerCase()
    );

    return (
        <main className="main-content">
            <div className="content-area">
                {/* Banner */}
                <div className="partner-banner">
                    <div className="banner-content">
                        <h2>{t('Become a partner')}</h2>
                        <p>{t('Invite partner desc')}</p>
                    </div>
                    <div className="banner-shapes">
                        <div className="shape-circle shape-1"></div>
                        <div className="shape-circle shape-2"></div>
                        <div className="shape-circle shape-3"></div>
                    </div>
                </div>

                {/* Section Options */}
                <div className="section-header">
                    <h1>{t('My accounts')}</h1>
                    <button className="btn-primary" onClick={handleOpenWizard}>
                        <Plus size={18} />
                        {t('Open account')}
                    </button>
                </div>

                {/* Controls Bar (Tabs & Filters) */}
                <div className="controls-bar">
                    <div className="tabs-container">
                        <div className="tabs">
                            <button
                                className={`tab-button ${activeTab === 'Live' ? 'active' : ''}`}
                                onClick={() => setActiveTab('Live')}
                            >
                                {t('Live')}
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'Demo' ? 'active' : ''}`}
                                onClick={() => setActiveTab('Demo')}
                            >
                                {t('Demo')}
                            </button>
                        </div>
                    </div>

                    <div className="filters">
                        <button className="filter-dropdown">
                            <ArrowDownToLine size={16} />
                            {t('Newest')}
                            <ChevronDown size={14} />
                        </button>
                        <div className="view-toggles">
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                            >
                                <List size={18} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dynamic Account Cards */}
                <div className={`accounts-list-container ${viewMode}`}>
                    {filteredAccounts.length > 0 ? (
                        filteredAccounts.map((acc, index) => (
                            <div key={acc.accountNumber || index} className="account-card">
                                <div className="account-header">
                                    <div className="account-tags">
                                        <span className="tag">Live Fx Hub</span>
                                        <span className="tag">{acc.groupName || 'Pro'}</span>
                                        <span className="account-id"># {acc.accountNumber}</span>
                                    </div>
                                </div>

                                <div className="account-body">
                                    <div className="amount">
                                        <span className="amount-whole">{Math.floor(acc.walletBalance || 0)}</span>
                                        <span className="amount-decimal">.{(acc.walletBalance || 0).toFixed(2).split('.')[1]}</span>
                                        <span className="currency">{acc.currency || 'USD'}</span>
                                    </div>

                                    <div className="account-actions">
                                        <button className="btn-action btn-trade" onClick={() => window.open('/trading-terminal', '_blank')}>
                                            <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>&#x21c4;</span>
                                            {t('Trade')}
                                        </button>
                                        <button className="btn-action">
                                            <ArrowDownToLine size={16} />
                                            {t('Deposit')}
                                        </button>
                                        <button className="btn-action">
                                            <ArrowUpToLine size={16} />
                                            {t('Withdraw')}
                                        </button>
                                        <div className="account-menu-wrapper" ref={openMenuAccountId === acc.accountNumber ? menuRef : null}>
                                            <button
                                                className={`btn-icon ${openMenuAccountId === acc.accountNumber ? 'active' : ''}`}
                                                onClick={() => setOpenMenuAccountId(openMenuAccountId === acc.accountNumber ? null : acc.accountNumber)}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openMenuAccountId === acc.accountNumber && (
                                                <div className="account-options-menu">
                                                    <button className="menu-item">
                                                        <Lock size={16} />
                                                        Reset Password
                                                    </button>
                                                    <button className="menu-item">
                                                        <FileDown size={16} />
                                                        Download Statement
                                                    </button>
                                                    <button
                                                        className="menu-item"
                                                        onClick={() => {
                                                            setSelectedAccountForInfo(acc);
                                                            setShowInfoModal(true);
                                                            setOpenMenuAccountId(null);
                                                        }}
                                                    >
                                                        <Info size={16} />
                                                        Account Info
                                                    </button>
                                                    <button className="menu-item">
                                                        <ArrowRightLeft size={16} />
                                                        Transfer
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-accounts">
                            <Info size={40} color="var(--text-muted)" />
                            <p>No {activeTab} accounts found.</p>
                        </div>
                    )}
                </div>

                {/* Account Creation Modal */}
                {showModal && (
                    <div className="accounts-modal-overlay">
                        <div className={`account-wizard-modal ${step === 2 ? 'wide' : ''}`}>
                            <div className="modal-header-wizard">
                                <h2>{step === 1 ? 'Select Account Type' : `Create ${accountType === 'live' ? 'Live' : 'Demo'} Account`}</h2>
                                <button className="close-btn-wizard" onClick={() => setShowModal(false)}><X size={20} /></button>
                            </div>

                            {step === 1 ? (
                                <div className="wizard-step-1">
                                    <div className="selection-cards-vertical">
                                        <div className="selection-card-v" onClick={() => handleSelectType('live')}>
                                            <div className="card-v-image">
                                                <img src="/live_hero.png" alt="Live Account" />

                                            </div>
                                            <div className="card-v-content">
                                                <h3>Live Account</h3>
                                                <p>Trade with real money and experience real market profit.</p>
                                                <div style={{ marginTop: 'auto' }}>
                                                    <button className="card-v-btn live-btn">
                                                        Select Live
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="selection-card-v" onClick={() => handleSelectType('demo')}>
                                            <div className="card-v-image">
                                                <img src="/demo_hero.png" alt="Demo Account" />
                                            </div>
                                            <div className="card-v-content">
                                                <h3>Demo Account</h3>
                                                <p>Practice trading with virtual funds without any financial risk.</p>
                                                <div style={{ marginTop: 'auto' }}>
                                                    <button className="card-v-btn demo-btn">
                                                        Select Demo
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form className="wizard-step-2" onSubmit={handleCreateAccount}>
                                    <div className="wizard-form-body">
                                        <div className="wizard-group">
                                            <label>Account Display Name</label>
                                            <div className="input-with-icon">
                                                <Wallet size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="e.g. My Real USD Scalper"
                                                    required
                                                    value={formData.accountName}
                                                    onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row-wizard">
                                            <div className="wizard-group">
                                                <label>Account Group (Type)</label>
                                                <div className={`custom-wizard-select ${accountType === 'demo' ? 'disabled' : ''}`} ref={groupDropdownRef}>
                                                    <div className={`select-trigger ${showGroupDropdown ? 'open' : ''}`} onClick={() => accountType !== 'demo' && setShowGroupDropdown(!showGroupDropdown)}>
                                                        <div className="trigger-left">
                                                            <Globe size={18} />
                                                            <span>{accountType === 'demo' ? 'Demo' : formData.group}</span>
                                                        </div>
                                                        {accountType !== 'demo' && <ChevronDown size={14} className={showGroupDropdown ? 'rotate' : ''} />}
                                                    </div>
                                                    {showGroupDropdown && accountType !== 'demo' && (
                                                        <div className="select-menu">
                                                            {['Standard', 'Classic', 'VIP', 'Elite', 'Royal+', 'ECN'].map(opt => (
                                                                <div
                                                                    key={opt}
                                                                    className={`select-option ${formData.group === opt ? 'selected' : ''}`}
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, group: opt });
                                                                        setShowGroupDropdown(false);
                                                                    }}
                                                                >
                                                                    {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="wizard-group">
                                                <label>Account Variant</label>
                                                <div className="custom-wizard-select" ref={variantDropdownRef}>
                                                    <div className={`select-trigger ${showVariantDropdown ? 'open' : ''}`} onClick={() => setShowVariantDropdown(!showVariantDropdown)}>
                                                        <div className="trigger-left">
                                                            <CreditCard size={18} />
                                                            <span>{formData.accountVariant === 'usd' ? 'USD Account' : 'Cent Account'}</span>
                                                        </div>
                                                        <ChevronDown size={14} className={showVariantDropdown ? 'rotate' : ''} />
                                                    </div>
                                                    {showVariantDropdown && (
                                                        <div className="select-menu">
                                                            <div
                                                                className={`select-option ${formData.accountVariant === 'usd' ? 'selected' : ''}`}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, accountVariant: 'usd' });
                                                                    setShowVariantDropdown(false);
                                                                }}
                                                            >
                                                                USD Account
                                                            </div>
                                                            <div
                                                                className={`select-option ${formData.accountVariant === 'cent' ? 'selected' : ''}`}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, accountVariant: 'cent' });
                                                                    setShowVariantDropdown(false);
                                                                }}
                                                            >
                                                                Cent Account
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {accountType === 'demo' && (
                                            <div className="wizard-group full-width">
                                                <label>Initial Balance (Optional)</label>
                                                <div className="input-with-icon">
                                                    <DollarSign size={18} />
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 10000"
                                                        value={formData.initialBalance}
                                                        onChange={e => setFormData({ ...formData, initialBalance: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="wizard-notice">
                                            <Info size={16} />
                                            <span>Default leverage of 1:100 will be applied to your new account.</span>
                                        </div>

                                        {formError && <div className="form-error-msg">{formError}</div>}
                                    </div>

                                    <div className="wizard-footer">
                                        <button
                                            type="button"
                                            className="btn-back-wizard"
                                            onClick={() => setStep(1)}
                                            disabled={formLoading}
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            className={`btn-create-wizard ${formLoading ? 'loading' : ''}`}
                                            disabled={formLoading}
                                        >
                                            {formLoading ? <div className="spinner-wizard"></div> : 'Create Account'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* OTP Verification Modal (Matching Signup.jsx layout) */}
                {showOtpModal && (
                    <div className="accounts-modal-overlay">
                        <div className="otp-modal-content" style={{ padding: '30px', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <button className="modal-close" onClick={() => setShowOtpModal(false)}>
                                <X size={20} />
                            </button>

                            <div className="otp-header">
                                <div className="success-icon-wrapper">
                                    <ShieldCheck size={32} />
                                </div>
                                <h3>Verify Your Email</h3>
                                <p className="otp-msg">To create a live account, please verify your email first. We've sent a 6-digit code.</p>
                                <div className="acc-badge">
                                    <div className="email-badge-label">
                                        <span>Email: </span>
                                        <strong style={{ fontSize: '12px' }}>
                                            {(() => {
                                                try {
                                                    return JSON.parse(localStorage.getItem('userData') || '{}').email || '';
                                                } catch (e) { return ''; }
                                            })()}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {otpError && (
                                <div className="login-status-message error compact">
                                    <span>{otpError}</span>
                                </div>
                            )}
                            {otpSuccess && (
                                <div className="login-status-message success compact">
                                    <span>{otpSuccess}</span>
                                </div>
                            )}

                            <div className="otp-input-container">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => otpInputRefs.current[i] = el}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            handleOtpChange(i, val);
                                        }}
                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    />
                                ))}
                            </div>

                            <button
                                className={`otp-verify-btn ${otpLoading ? 'loading' : ''}`}
                                onClick={handleVerifyOtp}
                                disabled={otpLoading}
                            >
                                {otpLoading ? <div className="loader-inner"></div> : "Verify & Continue"}
                            </button>

                            <div className="otp-footer">
                                <p>Didn't receive the code?</p>
                                {resendCooldown > 0 ? (
                                    <span className="resend-timer">Resend OTP in <strong>{formatTime(resendCooldown)}</strong></span>
                                ) : (
                                    <button className="resend-btn" onClick={handleResendOtp}>Resend OTP</button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Account Info Modal */}
                {showInfoModal && selectedAccountForInfo && (
                    <div className="accounts-modal-overlay account-info-overlay">
                        <div className="account-info-modal">
                            <div className="modal-header-wizard">
                                <h2>{t('Account Information')}</h2>
                                <button className="close-btn-wizard" onClick={() => setShowInfoModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="info-modal-content">
                                <div className="info-list">
                                    <div className="info-row">
                                        <div className="info-label">Account Number</div>
                                        <div className="info-value monospace">
                                            {selectedAccountForInfo.accountNumber}
                                            <button
                                                className="btn-copy"
                                                type="button"
                                                onClick={() => copyAccountNumber(selectedAccountForInfo.accountNumber)}
                                                title="Copy"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-label">Account Name</div>
                                        <div className="info-value">{selectedAccountForInfo.accountName || 'Not Set'}</div>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-label">Account Type</div>
                                        <div className="info-value type-badge">
                                            {selectedAccountForInfo.type}
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-label">Leverage</div>
                                        <div className="info-value">1:{selectedAccountForInfo.leverage}</div>
                                    </div>
                                </div>

                                <div className="info-balance-footer">
                                    <div className="balance-label-wrapper">
                                        <span className="info-label-large">Wallet Balance</span>
                                    </div>
                                    <div className="balance-amount">
                                        <span className="balance-number">
                                            {Number(selectedAccountForInfo.walletBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className="balance-currency">{selectedAccountForInfo.currency}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
