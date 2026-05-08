import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Wallet, TrendingUp, ArrowUpRight,
    Eye, EyeOff, ChevronDown, DollarSign, Info,
    History, ChevronLeft, ChevronRight, Clock,
    CheckCircle2, AlertCircle, Landmark, CreditCard,
    Bitcoin, ArrowRight, MessageSquare
} from 'lucide-react';
import './IBWallet.css';

export default function IBWallet({ ibData, onRefresh }) {
    const { t } = useTranslation();
    const [step, setStep] = useState(1); // 1: Dashboard, 2: Form, 3: Success, 4: History
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null);

    // History State
    const [history, setHistory] = useState([]);
    const [histLoading, setHistLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const balance = ibData?.balence || '0';
    const inOrders = ibData?.in_orders || 0;
    const totalBalance = Number(balance) + Number(inOrders);

    const [formData, setFormData] = useState({
        amount: '',
        currency: 'USD',
        withdrawMethod: 'bank',
        withdrawDetails: {},
        notes: ''
    });

    const fetchHistory = async (pageNum = 1) => {
        setHistLoading(true);
        try {
            const response = await fetch(`/api/ib/withdrawals?page=${pageNum}&limit=10`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();
            if (result.success) {
                setHistory(result.data);
                setTotalPages(result.pagination.totalPages);
                setPage(result.pagination.page);
            }
        } catch (err) {
            console.error('Fetch history error:', err);
        } finally {
            setHistLoading(false);
        }
    };

    const handleMethodSelect = (method) => {
        setFormData({ ...formData, withdrawMethod: method, withdrawDetails: {} });
        setStep(2);
    };

    const handleDetailChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            withdrawDetails: { ...formData.withdrawDetails, [name]: value }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.amount || parseFloat(formData.amount) <= 0) { setError('Please enter a valid amount'); return; }
        if (parseFloat(formData.amount) > parseFloat(balance)) { setError('Insufficient balance'); return; }

        setLoading(true);
        try {
            const response = await fetch('/api/ib/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.success) {
                setSuccessData(result.data);
                setStep(3);
                if (onRefresh) onRefresh();
            } else {
                setError(result.message || 'Withdrawal failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const methods = [
        { id: 'crypto', name: 'Crypto', time: 'Processed within 1 - 24 hours', fee: '0.00%', limit: '10 - 50,000 USD', icon: <Bitcoin />, iconBg: '#fff7ed', iconColor: '#f97316' },
        { id: 'bank', name: 'Bank Transfer', time: '1 - 3 Business Days', fee: '0.00%', limit: '50 - 100,000 USD', icon: <Landmark />, iconBg: '#eff6ff', iconColor: '#3b82f6' },
        { id: 'upi', name: 'UPI', time: 'Instant / Same Day', fee: '0.00%', limit: '10 - 2,000 USD', icon: <CreditCard />, iconBg: '#f0fdf4', iconColor: '#22c55e' },
        { id: 'other', name: 'Other', time: 'Custom request', fee: '0.00%', limit: 'Custom', icon: <MessageSquare />, iconBg: '#f5f3ff', iconColor: '#8b5cf6' },
    ];

    const renderMethodInputs = () => {
        switch (formData.withdrawMethod) {
            case 'bank':
                return (
                    <div className="dynamic-inputs">
                        <div className="form-group-premium-v3">
                            <label>Account Holder Name</label>
                            <input type="text" name="accountName" placeholder="John Doe" onChange={handleDetailChange} required />
                        </div>
                        <div className="form-group-premium-v3">
                            <label>Bank Name</label>
                            <input type="text" name="bankName" placeholder="Global Trust Bank" onChange={handleDetailChange} required />
                        </div>
                        <div className="form-group-premium-v3">
                            <label>Account Number / IBAN</label>
                            <input type="text" name="accountNumber" placeholder="XXXX XXXX XXXX" onChange={handleDetailChange} required />
                        </div>
                        <div className="form-group-premium-v3">
                            <label>SWIFT / IFSC Code</label>
                            <input type="text" name="swiftCode" placeholder="GTBKUS33" onChange={handleDetailChange} required />
                        </div>
                    </div>
                );
            case 'upi':
                return (
                    <div className="dynamic-inputs">
                        <div className="form-group-premium-v3">
                            <label>UPI ID (VPA)</label>
                            <input type="text" name="upiId" placeholder="username@bank" onChange={handleDetailChange} required />
                        </div>
                        <div className="form-group-premium-v3">
                            <label>Full Name</label>
                            <input type="text" name="fullName" placeholder="John Doe" onChange={handleDetailChange} required />
                        </div>
                    </div>
                );
            case 'crypto':
                return (
                    <div className="dynamic-inputs">
                        <div className="form-group-premium-v3">
                            <label>Network (e.g. TRC20, ERC20)</label>
                            <input type="text" name="network" placeholder="USDT (TRC20)" onChange={handleDetailChange} required />
                        </div>
                        <div className="form-group-premium-v3">
                            <label>Wallet Address</label>
                            <input type="text" name="address" placeholder="T..." onChange={handleDetailChange} required />
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="dynamic-inputs">
                        <div className="form-group-premium-v3">
                            <label>Payment Method Details</label>
                            <textarea name="otherDetails" placeholder="Describe your withdrawal method and details..." onChange={handleDetailChange} required />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="ib-wallet-container-v3">
            {step === 1 && (
                <div className="wallet-dashboard-v3">
                    <div className="dashboard-header-v3">
                        <h2 className="section-title-v3">Withdraw Funds</h2>
                        <button className="history-trigger-btn-v3" onClick={() => { setStep(4); fetchHistory(1); }}>
                            <History size={16} />
                            <span>Withdrawal History</span>
                        </button>
                    </div>

                    <div className="hero-card-dark-v3">
                        <div className="hero-content-v3">
                            <span className="hero-label-v3">Available for Withdrawal</span>
                            <h1 className="hero-amount-v3">${parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h1>

                            <div className="hero-stats-row-v3">
                                <div className="hero-stat-v3">
                                    <span className="stat-label-v3">Total Balance:</span>
                                    <span className="stat-value-v3">${parseFloat(totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="hero-stat-v3">
                                    <span className="stat-label-v3">Processing:</span>
                                    <span className="stat-value-v3">${parseFloat(inOrders).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="hero-icon-box-v3">
                            <div className="glass-icon-circle">
                                <Wallet size={32} />
                            </div>
                        </div>
                    </div>

                    <div className="methods-section-v3">
                        <div className="methods-header-v3">
                            <h3 className="section-subtitle-v3">Withdrawal Methods</h3>
                            <div className="info-banner-blue-v3">
                                <Info size={14} />
                                <span>Withdrawals are processed according to the sequence of deposits.</span>
                            </div>
                        </div>

                        <div className="methods-list-v3">
                            {methods.map((m) => (
                                <div key={m.id} className="method-row-card-v3">
                                    <div className="method-meta-v3">
                                        <div className="method-icon-box-v3" style={{ background: m.iconBg, color: m.iconColor }}>{m.icon}</div>
                                        <div className="method-name-v3">
                                            <strong>{m.name}</strong>
                                            <span>{m.time}</span>
                                        </div>
                                    </div>
                                    <div className="method-details-v3">
                                        <span className="fee-v3">{m.fee}</span>
                                        <span className="limit-v3">{m.limit}</span>
                                        <button className="withdraw-btn-v3" onClick={() => handleMethodSelect(m.id)}>Withdraw</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="withdraw-form-view-v3">
                    <div className="view-header-v3">
                        <button className="back-btn-v3" onClick={() => setStep(1)}>
                            <ChevronLeft size={18} />
                            <span>Back to Methods</span>
                        </button>
                        <h2>{formData.withdrawMethod.toUpperCase()} Details</h2>
                    </div>

                    <div className="form-container-v3">
                        <form onSubmit={handleSubmit}>
                            <div className="form-amount-box-v3">
                                <label>Withdraw Amount (USD)</label>
                                <div className="form-input-v3">
                                    <DollarSign size={18} />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <span className="balance-hint-v3">Max available: ${balance}</span>
                            </div>

                            {renderMethodInputs()}

                            <div className="form-group-premium-v3">
                                <label>Notes (Optional)</label>
                                <div className="form-input-v3">
                                    <MessageSquare size={18} />
                                    <input
                                        type="text"
                                        placeholder="Add a reference note..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="form-error-v3">
                                    <AlertCircle size={14} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button className="form-submit-btn-v3" disabled={loading}>
                                {loading ? 'Processing...' : 'Confirm Withdrawal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="success-view-v3">
                    <div className="success-card-v3">
                        <div className="success-icon-wrapper-v3">
                            <CheckCircle2 size={54} />
                        </div>
                        <h3>Request Submitted</h3>
                        <p>Your withdrawal of <strong>${formData.amount}</strong> is being processed.</p>

                        <div className="success-info-box-v3">
                            <div className="info-row-v3">
                                <span className="info-label-v3">Reference</span>
                                <span className="info-value-v3">{successData?.txnId || successData?.id?.split('-')[0].toUpperCase()}</span>
                            </div>
                            <div className="info-row-v3">
                                <span className="info-label-v3">Method</span>
                                <span className="info-value-v3">{formData.withdrawMethod.toUpperCase()}</span>
                            </div>
                        </div>

                        <button className="done-btn-v3" onClick={() => setStep(1)}>Back to Wallet</button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="history-view-v3">
                    <div className="view-header-v3">
                        <button className="back-btn-v3" onClick={() => setStep(1)}>
                            <ChevronLeft size={18} />
                            <span>Back to Wallet</span>
                        </button>
                        <h2>Withdrawal History</h2>
                    </div>

                    <div className="history-table-container-v3">
                        {histLoading ? (
                            <div className="hist-loading-v3">
                                <Clock className="spin-v3" />
                                <span>Fetching history...</span>
                            </div>
                        ) : (
                            <>
                                <table className="history-table-v3">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Method</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>TX ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.length > 0 ? history.map((tx) => (
                                            <tr key={tx.id}>
                                                <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                                                <td style={{ textTransform: 'uppercase' }}>{tx.withdrawMethod}</td>
                                                <td style={{ fontWeight: '700' }}>${tx.amount}</td>
                                                <td>
                                                    <span className={`status-pill-v3 \${tx.status}`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontFamily: 'monospace' }}>{tx.txnId || `#${tx.id.split('-')[0].toUpperCase()}`}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No withdrawal records found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {totalPages > 1 && (
                                    <div className="pagination-v3">
                                        <button disabled={page === 1} onClick={() => fetchHistory(page - 1)}>
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span>Page {page} of {totalPages}</span>
                                        <button disabled={page === totalPages} onClick={() => fetchHistory(page + 1)}>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
