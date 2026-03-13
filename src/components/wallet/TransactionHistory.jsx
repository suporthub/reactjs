import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TransactionHistory() {
    const { t } = useTranslation();
    return (
        <div className="transaction-container">
            <div className="empty-state">
                <div className="empty-state-icon-wrapper">
                    <Search className="empty-state-icon" size={36} />
                </div>
                <h2>{t('No transaction')}</h2>
                <p>{t('No transaction desc')}</p>
                <button className="reset-filters-btn">
                    <RotateCcw size={18} />
                    {t('Reset filters')}
                </button>
            </div>
        </div>
    );
}
