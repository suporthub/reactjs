import React from 'react';
import { useTranslation } from 'react-i18next';

export default function OtherPaymentDeposit() {
    const { t } = useTranslation();
    return (
        <div className="deposit-form-split-layout">
            <div className="deposit-form-left text-fields-wrapper">
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
