import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { t } = useTranslation();
  const userDataStr = localStorage.getItem('userData');
  const userData = userDataStr ? JSON.parse(userDataStr) : null;
  
  const initialFirstName = userData?.firstName || '';
  const initialLastName = userData?.lastName || '';
  
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);

  const fullName = `${firstName} ${lastName}`.trim() || t('Trader');
  const email = userData?.email || 'user@example.com';
  const phone = userData?.phoneNumber || '+000 000 0000';
  const bio = t('Trader');
  const kycStatus = userData?.kycStatus || 'none';

  const getKycStatusStyle = () => {
    switch (kycStatus?.toLowerCase()) {
      case 'approved': return { label: t('Verified'), color: '#10b981' };
      case 'pending': return { label: t('Pending'), color: '#f59e0b' };
      case 'rejected': return { label: t('Rejected'), color: '#ef4444' };
      default: return { label: t('Not Verified'), color: '#94a3b8' };
    }
  };

  const status = getKycStatusStyle();

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const token = localStorage.getItem('portalToken');
    
    try {
      const response = await fetch('https://v3.livefxhub.com:8444/api/live/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName
        })
      });

      const result = await response.json();
      
      if (result.success || result.status === 'success') {
        // Update local cache
        const updatedUser = { ...userData, firstName, lastName };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        setIsEditing(false);
      } else {
        alert(result.message || t('Failed to update profile'));
      }
    } catch (error) {
      alert(t('Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-profile-view">
      <h2>{t('My Profile')}</h2>

      {/* Profile Header Card */}
      <div className="settings-section-card">
        <div className="card-header-with-action">
          <div className="profile-main-info">
            <img 
              src="https://api.dicebear.com/7.x/bottts/svg?seed=Robot-User&backgroundColor=b6e3f4,c0aede,d1d4f9" 
              alt="Avatar" 
              className="profile-avatar-large" 
            />
            <div className="profile-details-text">
              <h3>{fullName}</h3>
              <p>{bio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="settings-section-card">
        <div className="card-header-with-action">
          <h3 className="info-label" style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '15px' }}>
            {t('Personal Information')}
          </h3>
          {!isEditing ? (
            <button className="settings-edit-btn" onClick={() => setIsEditing(true)}>
              {t('Edit')} <Pencil size={12} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`settings-edit-btn save ${loading ? 'loading' : ''}`} 
                onClick={handleSave} 
                disabled={loading}
                style={{ color: '#10b981', borderColor: '#10b981', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? t('Saving...') : t('Save')} <Check size={12} />
              </button>
              <button 
                className="settings-edit-btn cancel" 
                onClick={() => { setIsEditing(false); setFirstName(initialFirstName); setLastName(initialLastName); }} 
                disabled={loading}
                style={{ color: '#ef4444', borderColor: '#ef4444' }}
              >
                {t('Cancel')} <X size={12} />
              </button>
            </div>
          )}
        </div>
        
        <div className="info-grid">
          <div className="info-field-group">
            <span className="info-label">{t('First Name')}</span>
            {isEditing ? (
              <input 
                type="text" 
                className="edit-profile-input" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
              />
            ) : (
              <span className="info-value">{firstName || '-'}</span>
            )}
          </div>
          <div className="info-field-group">
            <span className="info-label">{t('Last Name')}</span>
            {isEditing ? (
              <input 
                type="text" 
                className="edit-profile-input" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
              />
            ) : (
              <span className="info-value">{lastName || '-'}</span>
            )}
          </div>
          <div className="info-field-group">
            <span className="info-label">{t('Email Address')}</span>
            <span className="info-value">{email}</span>
          </div>
          <div className="info-field-group">
            <span className="info-label">{t('Phone')}</span>
            <span className="info-value">{phone}</span>
          </div>
          <div className="info-field-group">
            <span className="info-label">{t('Bio')}</span>
            <span className="info-value">{bio}</span>
          </div>
          <div className="info-field-group">
            <span className="info-label">{t('KYC Status')}</span>
            <span className="info-value" style={{ color: status.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', background: status.color, borderRadius: '50%' }}></span>
              {status.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
