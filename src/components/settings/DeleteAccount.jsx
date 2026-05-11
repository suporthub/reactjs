import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DeleteAccount() {
  const { t } = useTranslation();
  return (
    <div className="settings-delete-view">
      <h2 style={{ color: '#DA5244' }}>{t('Delete Account')}</h2>

      <div className="settings-section-card">
        <div className="delete-account-warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertCircle size={20} color="#DA5244" />
            <strong style={{ color: '#DA5244' }}>{t('Delete warning')}</strong>
          </div>
          <p>
            {t('Delete account desc')}
          </p>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          {t('Delete account confirm')}
        </p>

        <button className="delete-confirm-btn">
          {t('Permanently Delete')}
        </button>
      </div>
    </div>
  );
}
