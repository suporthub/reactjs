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

export default function KycUpdate() {
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
  const [country, setCountry] = useState('');
  
  // Step 2 Data
  const [idProofType, setIdProofType] = useState('passport');
  const [addressProofType, setAddressProofType] = useState('utility_bill');
  const [idProofFile, setIdProofFile] = useState(null);
  const [addressProofFile, setAddressProofFile] = useState(null);

  const handleNextStep = () => {
    if (!addressLine1 || !city || !country) {
      setStatus({ type: 'error', message: 'All address fields are required.' });
      return;
    }
    setStatus(null);
    setStep(2);
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!idProofFile || !addressProofFile) {
      setStatus({ type: 'error', message: 'Please upload both documents.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    const token = localStorage.getItem('portalToken');

    const formData = new FormData();
    formData.append('addressLine1', addressLine1);
    formData.append('city', city);
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
        setStatus({ type: 'success', message: 'KYC documents submitted successfully!' });
        // Update local cache
        const updatedUser = { ...userData, kycStatus: 'pending' };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        
        setTimeout(() => {
          setShowWizard(false);
          setStep(1);
        }, 2000);
      } else {
        setStatus({ type: 'error', message: result.message || 'Submission failed' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (kycStatus === 'approved') {
    return (
      <div className="settings-kyc-view">
        <h2>KYC Update</h2>
        <div className="kyc-approved-container">
          <BadgeCheck size={64} className="kyc-success-icon" />
          <h3>KYC Approved</h3>
          <p>Your account is fully verified. You have complete access to all features.</p>
        </div>
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="settings-kyc-view">
        <div className="kyc-wizard-header">
          <button className="back-btn" onClick={() => setShowWizard(false)}><ArrowLeft size={18} /> Back</button>
          <h2>Account Verification</h2>
        </div>

        <div className="wizard-progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-label">Personal Details</span>
          </div>
          <div className="progress-connector"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-label">Document Upload</span>
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
              <h3>Step 1: Address Details</h3>
              <p className="step-desc">Please provide your current residential address details.</p>
              
              <div className="kyc-form-grid">
                <div className="kyc-form-group full">
                  <label>Address Line 1</label>
                  <input 
                    type="text" 
                    placeholder="Street address, building number, etc." 
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />
                </div>
                <div className="kyc-form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    placeholder="Your city" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="kyc-form-group">
                  <label>Country (2-letter ISO)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. US, AE, GB" 
                    maxLength="2"
                    style={{ textTransform: 'uppercase' }}
                    value={country}
                    onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="kyc-footer">
                <button className="kyc-next-btn" onClick={handleNextStep}>
                  Next Step <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="kyc-step-content">
              <h3>Step 2: Proof of Identity & Address</h3>
              <p className="step-desc">Upload clear photos or scans of your original documents.</p>

              <div className="doc-upload-grid">
                {/* ID Proof */}
                <div className="doc-upload-box">
                  <div className="upload-header">
                    <label>Identity Document</label>
                    <select value={idProofType} onChange={(e) => setIdProofType(e.target.value)}>
                      <option value="passport">Passport</option>
                      <option value="driving_license">Driving License</option>
                      <option value="national_id">National ID</option>
                    </select>
                  </div>
                  <div className={`upload-zone ${idProofFile ? 'has-file' : ''}`}>
                    <input 
                      type="file" 
                      id="idProof" 
                      accept="image/*,.pdf" 
                      onChange={(e) => setIdProofFile(e.target.files[0])}
                    />
                    <label htmlFor="idProof">
                      {idProofFile ? (
                        <>
                          <FileText size={24} />
                          <span>{idProofFile.name} (Click to change)</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={32} />
                          <span>Upload Front Side of ID</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Address Proof */}
                <div className="doc-upload-box">
                  <div className="upload-header">
                    <label>Proof of Address</label>
                    <select value={addressProofType} onChange={(e) => setAddressProofType(e.target.value)}>
                      <option value="utility_bill">Utility Bill</option>
                      <option value="bank_statement">Bank Statement</option>
                    </select>
                  </div>
                  <div className={`upload-zone ${addressProofFile ? 'has-file' : ''}`}>
                    <input 
                      type="file" 
                      id="addressProof" 
                      accept="image/*,.pdf" 
                      onChange={(e) => setAddressProofFile(e.target.files[0])}
                    />
                    <label htmlFor="addressProof">
                      {addressProofFile ? (
                        <>
                          <FileText size={24} />
                          <span>{addressProofFile.name} (Click to change)</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={32} />
                          <span>Upload Document (within 3 months)</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="kyc-footer">
                <button className="kyc-back-btn" onClick={() => setStep(1)} disabled={loading}>
                  Previous
                </button>
                <button 
                  className={`kyc-submit-btn ${loading ? 'loading' : ''}`} 
                  onClick={handleKycSubmit}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="spin" size={18} /> : 'Submit Verification'}
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
      <h2>KYC Update</h2>

      <div className="settings-section-card kyc-hero-card">
        <div className="kyc-hero-copy">
          <div className="kyc-status-badge">
            <Clock3 size={14} />
            {kycStatus === 'pending' ? 'Pending review' : 'Action Required'}
          </div>
          <h3>Keep your account verification details current</h3>
          <p>
            Update your identity documents and profile details to keep deposits, withdrawals,
            and account access running smoothly.
          </p>
          <div className="kyc-action-row">
            <button className="kyc-primary-btn" onClick={() => setShowWizard(true)}>
              <UploadCloud size={16} />
              Upload Documents
            </button>
            <button className="kyc-secondary-btn">
              <FileText size={16} />
              Review Submission
            </button>
          </div>
        </div>

        <div className="kyc-summary-panel">
          <div className="kyc-summary-head">
            <BadgeCheck size={18} />
            Verification Summary
          </div>
          <div className="kyc-summary-item">
            <span>Identity Document</span>
            <strong>{kycStatus === 'pending' ? 'Passport uploaded' : 'Required'}</strong>
          </div>
          <div className="kyc-summary-item">
            <span>Proof of Address</span>
            <strong>{kycStatus === 'pending' ? 'Verified' : 'Required'}</strong>
          </div>
          <div className="kyc-summary-item">
            <span>Review ETA</span>
            <strong>Within 24 hours</strong>
          </div>
        </div>
      </div>

    </div>
  );
}
