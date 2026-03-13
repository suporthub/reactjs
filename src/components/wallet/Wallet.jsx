import React, { useState } from 'react';
import {
    CreditCard, Calendar, Filter, History,
    FileText, Download, Upload
} from 'lucide-react';
import TransactionHistory from './TransactionHistory';
import Deposit from './Deposit';
import Withdraw from './Withdraw';
import FilterDropdown from './FilterDropdown';
import { useTranslation } from 'react-i18next';
import './wallet.css';

export default function Wallet({ activeTab = 'Transactions', setActiveTab }) {
    const { t } = useTranslation();
    const [dateRange, setDateRange] = useState('Last 7 days');
    const [txType, setTxType] = useState('All transaction types');
    const [status, setStatus] = useState('All statuses');
    const [account, setAccount] = useState('All accounts');

    const dateOptions = [
        'Last 3 days',
        'Last 7 days',
        'Last 30 days',
        'Last 3 months',
        { label: 'Custom date', hasSubmenu: true }
    ];

    const typeOptions = ['All transaction types', 'Deposit', 'Withdrawal', 'Transfer'];
    const statusOptions = ['All statuses', 'Success', 'Pending', 'Failed'];
    const accountOptions = ['All accounts', 'Real Account #1234', 'Demo Account #5678'];

    const getTitle = () => {
        switch (activeTab) {
            case 'Deposit': return t('Deposit Funds');
            case 'Withdraw': return t('Withdraw Funds');
            default: return t('Transaction history');
        }
    };

    return (
        <main className="main-content wallet-content">
            <div className="content-area">
                <div className="wallet-header">
                    <h1>{getTitle()}</h1>
                    {activeTab === 'Transactions' && (
                        <div className="header-actions">
                            <button className="header-action-btn deposit" onClick={() => setActiveTab('Deposit')}>
                                <Download size={16} />
                                {t('Deposit')}
                            </button>
                            <button className="header-action-btn withdraw" onClick={() => setActiveTab('Withdraw')}>
                                <Upload size={16} />
                                {t('Withdraw')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Content based on active tab */}
                {activeTab === 'Transactions' && (
                    <>
                        {/* Filter Bar only for Transactions as per image */}
                        <div className="filter-bar">
                            <FilterDropdown
                                icon={FileText}
                                value={account}
                                options={accountOptions}
                                onChange={setAccount}
                            />

                            <FilterDropdown
                                icon={Filter}
                                value={txType}
                                options={typeOptions}
                                onChange={setTxType}
                            />

                            <FilterDropdown
                                icon={CreditCard}
                                value={status}
                                options={statusOptions}
                                onChange={setStatus}
                            />

                            <FilterDropdown
                                icon={Calendar}
                                value={dateRange}
                                options={dateOptions}
                                onChange={setDateRange}
                            />
                        </div>
                        <TransactionHistory />
                    </>
                )}
                {activeTab === 'Deposit' && <Deposit />}
                {activeTab === 'Withdraw' && <Withdraw />}

            </div>
        </main>
    );
}
