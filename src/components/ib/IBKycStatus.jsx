import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Clock, Upload, FileText, ArrowLeft, Loader2, Calendar, Hash, BadgeCheck, Eye, Download, ExternalLink, X, CheckCircle2 } from 'lucide-react';
import './IBKycStatus.css';

export default function IBKycStatus({ ibData }) {
    const { t } = useTranslation();
    const [view, setView] = useState('main'); // 'main', 'review', or 'upload'
    const [kycDetails, setKycDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [imageUrls, setImageUrls] = useState({ nationalId: '', addressProof: '' });

    // Upload section state
    const [uploadFiles, setUploadFiles] = useState({
        nationalId: null,
        addressProof: null
    });

    const currentKycStatus = (ibData?.kycStatus || ibData?.kyc_status || 'pending').toLowerCase();
    const canUpload = currentKycStatus === 'pending' || currentKycStatus === 'rejected';
    const baseUrl = 'https://v3.livefxhub.com:8444';

    const fetchProtectedImage = async (path, type) => {
        if (!path) return;
        const filename = path.split('/').pop();
        const imageUrl = `${baseUrl}/api/ib/kyc/view/${filename}`;
        const token = localStorage.getItem('portalToken');
        try {
            const response = await fetch(imageUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                setImageUrls(prev => ({ ...prev, [type]: objectUrl }));
            }
        } catch (err) {
            console.error(`Error loading ${type} image:`, err);
        }
    };

    const handleReviewClick = async () => {
        setView('review');
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('portalToken');
        try {
            const response = await fetch(`${baseUrl}/api/ib/kyc`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (result.success) {
                setKycDetails(result.data);
                if (result.data.nationalIdUrl) fetchProtectedImage(result.data.nationalIdUrl, 'nationalId');
                if (result.data.addressProofUrl) fetchProtectedImage(result.data.addressProofUrl, 'addressProof');
            } else {
                setError(result.message || t('Failed to fetch KYC details'));
            }
        } catch (err) {
            setError(t('Something went wrong. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setUploadFiles(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadFiles.nationalId || !uploadFiles.addressProof) {
            setError(t('Please select both documents before submitting.'));
            return;
        }

        setSubmitLoading(true);
        setError(null);
        setSuccessMsg(null);

        const token = localStorage.getItem('portalToken');
        const formData = new FormData();
        formData.append('nationalIdFile', uploadFiles.nationalId);
        formData.append('addressProofFile', uploadFiles.addressProof);

        try {
            const response = await fetch(`${baseUrl}/api/ib/kyc`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            const result = await response.json();
            if (result.success) {
                setSuccessMsg(t('Documents updated successfully! Moving to review...'));
                setTimeout(() => {
                    setSuccessMsg(null);
                    handleReviewClick();
                }, 2000);
            } else {
                setError(result.message || t('Update failed. Please try again.'));
            }
        } catch (err) {
            setError(t('A network error occurred. Check your connection.'));
        } finally {
            setSubmitLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (imageUrls.nationalId) URL.revokeObjectURL(imageUrls.nationalId);
            if (imageUrls.addressProof) URL.revokeObjectURL(imageUrls.addressProof);
        };
    }, [imageUrls]);

    if (view === 'review') {
        return (
            <div className="ibkyc-review-section">
                <div className="ibkyc-section-header">
                    <button className="ibkyc-back-btn" onClick={() => setView('main')}>
                        <ArrowLeft size={18} />
                        <span>{t('Back to KYC status')}</span>
                    </button>
                    <h3>{t('Submission Review')}</h3>
                </div>

                <div className="ibkyc-section-body">
                    {loading ? (
                        <div className="ibkyc-loader-box">
                            <Loader2 className="spin" size={40} />
                            <p>{t('Fetching your verified documents...')}</p>
                        </div>
                    ) : error ? (
                        <div className="ibkyc-error-alert">
                            <ShieldCheck size={24} color="#ef4444" />
                            <p>{error}</p>
                            <button className="ibkyc-retry-btn" onClick={handleReviewClick}>{t('Retry')}</button>
                        </div>
                    ) : kycDetails && (
                        <div className="ibkyc-full-layout">
                            <div className="ibkyc-summary-row">
                                <div className={`ibkyc-snapshot-card ${(kycDetails.kycStatus || kycDetails.kyc_status || 'pending').toLowerCase()}`}>
                                    <div className="ibkyc-snapshot-icon"><Clock size={16} /></div>
                                    <div className="ibkyc-snapshot-info">
                                        <label>{t('KYC Status')}</label>
                                        <strong className={`ibkyc-status-text ${(kycDetails.kycStatus || kycDetails.kyc_status || 'pending').toLowerCase()}`}>
                                            {t((kycDetails.kycStatus || kycDetails.kyc_status || 'PENDING').toUpperCase())}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="ibkyc-docs-grid">
                                <div className="ibkyc-doc-box">
                                    <div className="ibkyc-doc-head">
                                        <div className="ibkyc-doc-title"><ShieldCheck size={18} color="#3687ED" /><h4>{t('Proof of Identity')}</h4></div>
                                        {imageUrls.nationalId && <a href={imageUrls.nationalId} target="_blank" rel="noopener noreferrer" className="ibkyc-doc-link"><ExternalLink size={14} /></a>}
                                    </div>
                                    <div className="ibkyc-doc-preview">
                                        {imageUrls.nationalId ? <img src={imageUrls.nationalId} alt="Identity Proof" /> : <div className="ibkyc-no-img">{t('Image could not be loaded')}</div>}
                                    </div>
                                </div>
                                <div className="ibkyc-doc-box">
                                    <div className="ibkyc-doc-head">
                                        <div className="ibkyc-doc-title"><FileText size={18} color="#10B981" /><h4>{t('Proof of Address')}</h4></div>
                                        {imageUrls.addressProof && <a href={imageUrls.addressProof} target="_blank" rel="noopener noreferrer" className="ibkyc-doc-link"><ExternalLink size={14} /></a>}
                                    </div>
                                    <div className="ibkyc-doc-preview">
                                        {imageUrls.addressProof ? <img src={imageUrls.addressProof} alt="Address Proof" /> : <div className="ibkyc-no-img">{t('Image could not be loaded')}</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="ibkyc-footer-note">
                                <p>{t('These documents are under strict review. You will be notified via email once the compliance team validates your submission.')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'upload') {
        return (
            <div className="ibkyc-upload-section">
                <div className="ibkyc-section-header">
                    <button className="ibkyc-back-btn" onClick={() => setView('main')}>
                        <ArrowLeft size={18} />
                        <span>{t('Back to KYC status')}</span>
                    </button>
                    <h3>{t('Update KYC Documents')}</h3>
                </div>

                <div className="ibkyc-section-body">
                    {successMsg && <div className="ibkyc-success-msg"><CheckCircle2 size={20} />{successMsg}</div>}
                    {error && <div className="ibkyc-error-msg"><X size={20} />{error}</div>}

                    <form className="ibkyc-upload-grid" onSubmit={handleUploadSubmit}>
                        <div className="ibkyc-upload-col">
                            <div className="ibkyc-upload-card">
                                <div className="ibkyc-card-top">
                                    <ShieldCheck size={28} color="#3687ED" />
                                    <div className="ibkyc-card-details">
                                        <h4>{t('National ID / Passport')}</h4>
                                        <p>{t('Front view or passport bio page')}</p>
                                    </div>
                                </div>
                                <div className={`ibkyc-dropzone ${uploadFiles.nationalId ? 'ibkyc-active' : ''}`}>
                                    <input type="file" id="nationalId" name="nationalId" accept="image/*,.pdf" onChange={handleFileChange} />
                                    <label htmlFor="nationalId">
                                        <Upload size={24} />
                                        <span>{uploadFiles.nationalId ? uploadFiles.nationalId.name : t('Click to upload identity proof')}</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="ibkyc-upload-col">
                            <div className="ibkyc-upload-card">
                                <div className="ibkyc-card-top">
                                    <FileText size={28} color="#10B981" />
                                    <div className="ibkyc-card-details">
                                        <h4>{t('Proof of Address')}</h4>
                                        <p>{t('Utility bill or bank statement')}</p>
                                    </div>
                                </div>
                                <div className={`ibkyc-dropzone ${uploadFiles.addressProof ? 'ibkyc-active' : ''}`}>
                                    <input type="file" id="addressProof" name="addressProof" accept="image/*,.pdf" onChange={handleFileChange} />
                                    <label htmlFor="addressProof">
                                        <Upload size={24} />
                                        <span>{uploadFiles.addressProof ? uploadFiles.addressProof.name : t('Click to upload address proof')}</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="ibkyc-submit-row">
                            <button type="submit" className="ibkyc-submit-btn" disabled={submitLoading || !uploadFiles.nationalId || !uploadFiles.addressProof}>
                                {submitLoading ? <Loader2 className="spin" size={18} /> : t('Submit Documents')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="ibkyc-main-view">
            <div className="ibkyc-page-head">
                <h3>{t('KYC Update')}</h3>
            </div>
            <div className="ibkyc-hero-card">
                <div className="ibkyc-hero-content">
                    <div className="ibkyc-status-row">
                        <div className={`ibkyc-status-chip ${currentKycStatus}`}>
                            <Clock size={14} />
                            <span>{t(currentKycStatus.toUpperCase())}</span>
                        </div>
                    </div>

                    <h2 className="ibkyc-hero-title">{t('Keep your account verification details current')}</h2>
                    <p className="ibkyc-hero-desc">
                        {t('Update your identity documents and profile details to keep deposits, withdrawals, and account access running smoothly.')}
                    </p>

                    <div className="ibkyc-hero-actions">
                        <button 
                            className={`ibkyc-btn-primary ${!canUpload ? 'ibkyc-disabled' : ''}`} 
                            onClick={() => canUpload && setView('upload')}
                            disabled={!canUpload}
                        >
                            <Upload size={18} />
                            <span>{t('Upload Documents')}</span>
                        </button>
                        <button className="ibkyc-btn-secondary" onClick={handleReviewClick}>
                            <FileText size={18} />
                            <span>{t('Review Submission')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
