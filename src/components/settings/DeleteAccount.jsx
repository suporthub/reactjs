import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DeleteAccount() {
  return (
    <div className="settings-delete-view">
      <h2 style={{ color: '#DA5244' }}>Delete Account</h2>

      <div className="settings-section-card">
        <div className="delete-account-warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertCircle size={20} color="#DA5244" />
            <strong style={{ color: '#DA5244' }}>Warning: This action is permanent</strong>
          </div>
          <p>
            Deleting your account will result in the permanent removal of all your trading history,
            wallet data, and personal information. This action cannot be undone.
          </p>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Please confirm you would like to delete your account by clicking the button below. 
          You may be asked to provide your password for security verification.
        </p>

        <button className="delete-confirm-btn">
          Permanently Delete My Account
        </button>
      </div>
    </div>
  );
}
