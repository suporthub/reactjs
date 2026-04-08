import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Wallet, TrendingUp, ArrowUpRight, 
    Eye, EyeOff, ChevronDown, DollarSign, Info
} from 'lucide-react';
import './IBWallet.css';

export default function IBWallet({ ibData }) {
    const { t } = useTranslation();
    const [showBalance, setShowBalance] = useState(true);

    const balance = ibData?.balence || '0';
    const totalEarned = ibData?.toatal_earned || '0';
    const totalWithdraw = ibData?.total_withdraw || '0';

    return (
        <div className="ib-wallet-wrapper">
            <div className="wallet-main-card-premium">
                <div className="wallet-card-header">
                    <div className="wallet-selector-pill">
                        <div className="currency-icon-circle">
                            <DollarSign size={14} />
                        </div>
                        <span>{t('IB Wallet')}</span>
                        <ChevronDown size={14} />
                    </div>
                </div>

                <div className="wallet-balance-core">
                    <span className="balance-label">{t('Total Value')}</span>
                    <div className="balance-amount-row">
                        <h1 className="main-balance">
                            {showBalance ? `$${balance}` : '•••••'}
                        </h1>
                        <button className="visibility-toggle-btn" onClick={() => setShowBalance(!showBalance)}>
                            {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                    </div>
                </div>

                <div className="wallet-action-footer">
                    <button className="wallet-btn-secondary large-btn">
                        <ArrowUpRight size={18} />
                        <span>{t('Withdraw')}</span>
                    </button>
                </div>

                <div className="withdrawal-processing-notice">
                    <Info size={14} />
                    <p><strong>{t('note:')}</strong> {t('Withdrawal requests are processed on the 5th of each month. Commissions will be calculated based on your clients\' transactions from the previous month')}</p>
                </div>
            </div>

            <div className="wallet-stats-grid-premium">
                <div className="stat-card-micro">
                    <div className="stat-icon earned">
                        <TrendingUp size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-lbl">{t('Total Earned')}</span>
                        <strong className="stat-val">${totalEarned}</strong>
                    </div>
                </div>

                <div className="stat-card-micro">
                    <div className="stat-icon withdrawn">
                        <ArrowUpRight size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-lbl">{t('Total Withdrawn')}</span>
                        <strong className="stat-val">${totalWithdraw}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
