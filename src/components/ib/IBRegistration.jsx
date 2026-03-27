import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Check, AlertCircle, X, Loader2 } from 'lucide-react';
import './ib.css';

export default function IBRegistration() {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(1);
    const [userData, setUserData] = useState(() => {
        const saved = localStorage.getItem('userData');
        return saved ? JSON.parse(saved) : null;
    });

    const [formData, setFormData] = useState({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        email: userData?.email || '',
        whatsappNumber: userData?.phone || '',
        languages: '',
        previousIbExperience: '',
        previousCompany: '',
        description: '',
        nationalIdType: 'Passport',
        addressProofType: 'Utility Bill'
    });

    const [files, setFiles] = useState({
        nationalIdFile: null,
        addressProofFile: null
    });

    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        if (selectedFiles && selectedFiles[0]) {
            setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
        }
    };

    const validateStep = (step) => {
        if (step === 1) {
            return formData.firstName && formData.lastName && formData.whatsappNumber && formData.languages;
        }
        return true; // Step 2 is mostly optional based on the request table
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        } else {
            setNotification({ message: 'Please fill in all required fields.', type: 'error' });
        }
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!files.nationalIdFile || !files.addressProofFile) {
            setNotification({ message: 'Please upload the required documents.', type: 'error' });
            return;
        }

        setLoading(true);
        // ... API logic remains same ...
        const token = localStorage.getItem('portalToken');
        const fingerprint = localStorage.getItem('deviceFingerprint');

        const payload = new FormData();
        Object.keys(formData).forEach(key => payload.append(key, formData[key]));
        payload.append('nationalIdFile', files.nationalIdFile);
        payload.append('addressProofFile', files.addressProofFile);

        try {
            const response = await fetch('https://v3.livefxhub.com:8444/api/ib/signup', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'X-Device-Fingerprint': fingerprint },
                body: payload
            });
            const result = await response.json();
            if (result.success) {
                setNotification({ message: result.message, type: 'success' });
                // Reset or redirect?
            } else {
                setNotification({ message: result.message, type: 'error' });
            }
        } catch (error) {
            setNotification({ message: 'Network error', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="main-content">
            {notification && (
                <div className={`settings-snackbar ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    <span>{notification.message}</span>
                </div>
            )}

            <div className="content-area ib-reg-area">
                <div className="ib-form-card">
                    <div className="ib-form-header">
                        <h2>{t('Become an Introducing Broker')}</h2>
                        <div className="ib-stepper">
                            <div className={`step-dot ${currentStep >= 1 ? 'active' : ''}`}>1</div>
                            <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
                            <div className={`step-dot ${currentStep >= 2 ? 'active' : ''}`}>2</div>
                            <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`}></div>
                            <div className={`step-dot ${currentStep >= 3 ? 'active' : ''}`}>3</div>
                        </div>
                    </div>

                    <form className="ib-signup-form" onSubmit={handleSubmit}>
                        {currentStep === 1 && (
                            <div className="form-step-content bounceIn">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('First Name')}</label>
                                        <input name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('Last Name')}</label>
                                        <input name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('Email')}</label>
                                        <input type="email" value={formData.email} disabled className="disabled-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('WhatsApp Number')}</label>
                                        <input name="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('Languages Spoken')}</label>
                                    <input name="languages" placeholder="English, Hindi, etc." value={formData.languages} onChange={handleInputChange} required />
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="form-step-content bounceIn">
                                <div className="form-group">
                                    <label>{t('Previous IB Experience')}</label>
                                    <textarea name="previousIbExperience" rows="4" value={formData.previousIbExperience} onChange={handleInputChange}></textarea>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('Previous Company')}</label>
                                        <input name="previousCompany" value={formData.previousCompany} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('Description')}</label>
                                        <input name="description" value={formData.description} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="form-step-content bounceIn">
                                <div className="file-upload-section">
                                    <div className="file-upload-box">
                                        <label>{t('National ID Type')}</label>
                                        <select name="nationalIdType" className="ib-select" value={formData.nationalIdType} onChange={handleInputChange}>
                                            <option value="Passport">Passport</option>
                                            <option value="ID Card">National ID Card</option>
                                        </select>
                                        <div className={`file-input-wrapper ${files.nationalIdFile ? 'has-file' : ''}`}>
                                            <input type="file" id="id-file" name="nationalIdFile" onChange={handleFileChange} />
                                            <label htmlFor="id-file" className="file-label">
                                                {files.nationalIdFile ? <Check size={20} className="success-icon" /> : <Upload size={20} />}
                                                <span>{files.nationalIdFile ? files.nationalIdFile.name : t('Upload ID')}</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="file-upload-box">
                                        <label>{t('Address Proof Type')}</label>
                                        <select name="addressProofType" className="ib-select" value={formData.addressProofType} onChange={handleInputChange}>
                                            <option value="Utility Bill">Utility Bill</option>
                                            <option value="Bank Statement">Bank Statement</option>
                                        </select>
                                        <div className={`file-input-wrapper ${files.addressProofFile ? 'has-file' : ''}`}>
                                            <input type="file" id="addr-file" name="addressProofFile" onChange={handleFileChange} />
                                            <label htmlFor="addr-file" className="file-label">
                                                {files.addressProofFile ? <Check size={20} className="success-icon" /> : <Upload size={20} />}
                                                <span>{files.addressProofFile ? files.addressProofFile.name : t('Upload Proof')}</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-navigation">
                            {currentStep > 1 && (
                                <button type="button" className="ib-nav-btn back" onClick={prevStep}>
                                    {t('Back')}
                                </button>
                            )}
                            {currentStep < 3 ? (
                                <button type="button" className="ib-nav-btn next" onClick={nextStep}>
                                    {t('Next')}
                                </button>
                            ) : (
                                <button type="submit" className="ib-submit-btn" disabled={loading}>
                                    {loading ? <Loader2 className="spin" size={20} /> : t('Submit Application')}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
