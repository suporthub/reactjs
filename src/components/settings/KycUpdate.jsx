import React, { useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  FileText,
  UploadCloud,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function KycUpdate() {
  const { t } = useTranslation();
  const userDataStr = localStorage.getItem('userData');
  const userData = userDataStr ? JSON.parse(userDataStr) : null;
  const kycStatus = userData?.kycStatus || 'none';

  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }

  // Step 1 Data
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('');

  // Step 2 Data
  const [idProofType, setIdProofType] = useState('passport');
  const [addressProofType, setAddressProofType] = useState('utility_bill');
  const [idProofFile, setIdProofFile] = useState(null);
  const [addressProofFile, setAddressProofFile] = useState(null);

  const handleNextStep = () => {
    if (!addressLine1 || !city || !pincode || !country) {
      setStatus({ type: 'error', message: t('All address fields are required.') });
      return;
    }
    setStatus(null);
    setStep(2);
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!idProofFile || !addressProofFile) {
      setStatus({ type: 'error', message: t('Please upload both documents.') });
      return;
    }

    setLoading(true);
    setStatus(null);
    const token = localStorage.getItem('portalToken');

    const formData = new FormData();
    formData.append('addressLine1', addressLine1);
    formData.append('city', city);
    formData.append('pincode', pincode);
    formData.append('country', country);
    formData.append('idProofType', idProofType);
    formData.append('addressProofType', addressProofType);
    formData.append('idProof', idProofFile);
    formData.append('addressProof', addressProofFile);

    try {
      const response = await fetch('https://v3.livefxhub.com:8444/api/live/kyc', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success || result.status === 'success') {
        setStatus({ type: 'success', message: t('KYC documents submitted successfully!') });
        // Update local cache
        const updatedUser = { ...userData, kycStatus: 'pending' };
        localStorage.setItem('userData', JSON.stringify(updatedUser));

        setTimeout(() => {
          setShowWizard(false);
          setStep(1);
        }, 2000);
      } else {
        setStatus({ type: 'error', message: result.message || t('Submission failed') });
      }
    } catch (error) {
      setStatus({ type: 'error', message: t('Network error. Please try again.') });
    } finally {
      setLoading(false);
    }
  };

  if (kycStatus === 'approved') {
    return (
      <div className="settings-kyc-view">
        <h2>{t('KYC Update')}</h2>
        <div className="kyc-approved-container">
          <BadgeCheck size={64} className="kyc-success-icon" />
          <h3>{t('KYC Approved')}</h3>
          <p>{t('KYC approved desc')}</p>
        </div>
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="settings-kyc-view">
        <div className="kyc-wizard-header">
          <button className="back-btn" onClick={() => setShowWizard(false)}><ArrowLeft size={18} /> {t('Back')}</button>
          <h2>{t('Account Verification')}</h2>
        </div>

        <div className="wizard-progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-label">{t('Personal Details')}</span>
          </div>
          <div className="progress-connector"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-label">{t('Document Upload')}</span>
          </div>
        </div>

        <div className="settings-section-card kyc-wizard-card">
          {status && (
            <div className={`kyc-status-alert ${status.type}`}>
              {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{status.message}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="kyc-step-content">
              <h3>{t('Step 1: Address Details')}</h3>
              <p className="step-desc">{t('Address details desc')}</p>

              <div className="kyc-form-grid">
                <div className="kyc-form-group full">
                  <label>{t('Address Line 1')}</label>
                  <input
                    type="text"
                    placeholder={t('Address placeholder')}
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />
                </div>
                <div className="kyc-form-group">
                  <label>{t('City')}</label>
                  <input
                    type="text"
                    placeholder={t('City placeholder')}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="kyc-form-group">
                  <label>{t('Pincode / Zip')}</label>
                  <input
                    type="text"
                    placeholder={t('Pincode placeholder')}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </div>
                <div className="kyc-form-group">
                  <label>{t('Country ISO')}</label>
                  <input
                    type="text"
                    placeholder={t('Country placeholder')}
                    maxLength="2"
                    style={{ textTransform: 'uppercase' }}
                    value={country}
                    onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="kyc-footer">
                <button className="kyc-next-btn" onClick={handleNextStep}>
                  {t('Next Step')} <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="kyc-step-content">
              <h3>{t('Step 2 title')}</h3>
              <p className="step-desc">{t('Step 2 desc')}</p>

              <div className="doc-upload-grid">
                {/* ID Proof */}
                <div className="doc-upload-box">
                  <div className="upload-header">
                    <label>{t('Identity Document')}</label>
                    <select value={idProofType} onChange={(e) => setIdProofType(e.target.value)}>
                      <option value="passport">{t('Passport')}</option>
                      <option value="driving_license">{t('Driving License')}</option>
                      <option value="national_id">{t('National ID')}</option>
                      <option value="other">{t('Other')}</option>
                    </select>
                  </div>
                  <div className={`upload-zone ${idProofFile ? 'has-file' : ''}`}>
                    <input
                      type="file"
                      id="idProof"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && file.size > 20 * 1024 * 1024) {
                          setStatus({ type: 'error', message: t('File size too large (Max 20MB)') });
                          return;
                        }
                        setIdProofFile(file);
                      }}
                    />
                    <label htmlFor="idProof">
                      {idProofFile ? (
                        <>
                          <FileText size={24} />
                          <span>{idProofFile.name} ({t('Click to change')})</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={32} />
                          <span>{t('Upload Front Side of ID')}</span>
                        </>
                      )}
                    </label>
                  </div>
                  <div className="upload-note">
                    {t('Upload front and back side as a single image or PDF (Max 20MB).')}
                    <br />
                    <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{t('PNG, PDF, JPEG, JPG acceptable')}</span>
                  </div>
                </div>

                {/* Address Proof */}
                <div className="doc-upload-box">
                  <div className="upload-header">
                    <label>{t('Proof of Address')}</label>
                    <select value={addressProofType} onChange={(e) => setAddressProofType(e.target.value)}>
                      <option value="utility_bill">{t('Utility Bill')}</option>
                      <option value="bank_statement">{t('Bank Statement')}</option>
                      <option value="passport">{t('Passport')}</option>
                      <option value="driving_license">{t('Driving License')}</option>
                      <option value="national_id">{t('National ID')}</option>
                      <option value="other">{t('Other')}</option>
                    </select>
                  </div>
                  <div className={`upload-zone ${addressProofFile ? 'has-file' : ''}`}>
                    <input
                      type="file"
                      id="addressProof"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && file.size > 20 * 1024 * 1024) {
                          setStatus({ type: 'error', message: t('File size too large (Max 20MB)') });
                          return;
                        }
                        setAddressProofFile(file);
                      }}
                    />
                    <label htmlFor="addressProof">
                      {addressProofFile ? (
                        <>
                          <FileText size={24} />
                          <span>{addressProofFile.name} ({t('Click to change')})</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={32} />
                          <span>{t('Upload Document (within 3 months)')}</span>
                        </>
                      )}
                    </label>
                  </div>
                  <div className="upload-note">
                    {t('Upload front and back side as a single image or PDF (Max 20MB).')}
                    <br />
                    <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{t('PNG, PDF, JPEG, JPG acceptable')}</span>
                  </div>
                </div>
              </div>

              <div className="kyc-footer">
                <button className="kyc-back-btn" onClick={() => setStep(1)} disabled={loading}>
                  {t('Previous')}
                </button>
                <button
                  className={`kyc-submit-btn ${loading ? 'loading' : ''}`}
                  onClick={handleKycSubmit}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="spin" size={18} /> : t('Submit Verification')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="settings-kyc-view">
      <h2>{t('KYC Update')}</h2>

      <div className="settings-section-card kyc-hero-card">
        <div className="kyc-hero-copy">
          <div className="kyc-status-badge">
            <Clock3 size={14} />
            {kycStatus === 'pending' ? t('Pending review') : t('Action Required')}
          </div>
          <h3>{t('KYC hero title')}</h3>
          <p>
            {t('KYC hero desc')}
          </p>
          <div className="kyc-action-row">
            <button className="kyc-primary-btn" onClick={() => setShowWizard(true)}>
              <UploadCloud size={16} />
              {t('Upload Documents')}
            </button>
            <button className="kyc-secondary-btn">
              <FileText size={16} />
              {t('Review Submission')}
            </button>
          </div>
        </div>

        <div className="kyc-summary-panel">
          <div className="kyc-summary-head">
            <BadgeCheck size={18} />
            {t('Verification Summary')}
          </div>
          <div className="kyc-summary-item">
            <span>{t('Identity Document')}</span>
            <strong>{kycStatus === 'pending' ? t('Passport uploaded') : t('Required')}</strong>
          </div>
          <div className="kyc-summary-item">
            <span>{t('Proof of Address')}</span>
            <strong>{kycStatus === 'pending' ? t('Verified') : t('Required')}</strong>
          </div>
          <div className="kyc-summary-item">
            <span>{t('Review ETA')}</span>
            <strong>{t('Within 24 hours')}</strong>
          </div>
        </div>
      </div>

    </div>
  );
}
