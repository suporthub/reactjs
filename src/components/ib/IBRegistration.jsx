import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Upload, Check, AlertCircle, X, Loader2, User, 
    LayoutDashboard, Users, Wallet, Copy, ExternalLink,
    ChevronRight, ArrowRight, ShieldCheck, BadgeCheck,
    DollarSign, TrendingUp, UserCheck, Award
} from 'lucide-react';
import IBProfile from './IBProfile';
import LoyaltyProgram from './LoyaltyProgram';
import IBKycStatus from './IBKycStatus';
import IBWallet from './IBWallet';
import './ib.css';

export default function IBRegistration() {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(1);
    const [userData, setUserData] = useState(() => {
        const saved = localStorage.getItem('userData');
        return saved ? JSON.parse(saved) : null;
    });

    const isIB = userData?.isIB || false;
    const [activePortalTab, setActivePortalTab] = useState('Profile');
    const [ibData, setIbData] = useState(null);
    const [portalLoading, setPortalLoading] = useState(isIB);
    const [notification, setNotification] = useState(null);

    // Registration Form State
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

    useEffect(() => {
        if (isIB) {
            fetchIbProfile();
        }
    }, [isIB]);

    const fetchIbProfile = async () => {
        const token = localStorage.getItem('portalToken');
        try {
            // Using the exact endpoint provided: https://v3.livefxhub.com:8444/api/live/ib/me 
            // (Note: Adding /api/live/ib/ to match the platform's standard routing for IB authenticated calls)
            const response = await fetch('https://v3.livefxhub.com:8444/api/ib/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.success) {
                setIbData(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch IB profile:", error);
        } finally {
            setPortalLoading(false);
        }
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
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
            } else {
                setNotification({ message: result.message, type: 'error' });
            }
        } catch (error) {
            setNotification({ message: 'Something went wrong.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (isIB) {
        if (portalLoading) {
            return (
                <div className="ib-portal-loading">
                    <Loader2 className="spin" size={40} />
                </div>
            );
        }

        const renderPortalContent = () => {
            switch (activePortalTab) {
                case 'Profile':
                    return <IBProfile ibData={ibData} />;
                case 'Loyalty':
                    return <LoyaltyProgram ibData={ibData} />;
                case 'KYC':
                    return <IBKycStatus ibData={ibData} />;
                case 'Clients':
                    return <div className="portal-placeholder">Clients Management Coming Soon</div>;
                case 'Wallet':
                    return <IBWallet ibData={ibData} />;
                default:
                    return null;
            }
        };

        return (
            <div className="ib-portal-container">
                <div className="ib-portal-sidebar">
                    <div className="portal-sidebar-head">
                        <div className="portal-logo">
                            <BadgeCheck size={24} className="badge-icon" />
                            <span>IB Portal</span>
                        </div>
                    </div>
                    <nav className="portal-nav">
                        <button className={`portal-nav-item ${activePortalTab === 'Profile' ? 'active' : ''}`} onClick={() => setActivePortalTab('Profile')}>
                            <User size={16} /> Profile
                        </button>
                        <button className={`portal-nav-item ${activePortalTab === 'Loyalty' ? 'active' : ''}`} onClick={() => setActivePortalTab('Loyalty')}>
                            <BadgeCheck size={16} /> Loyalty Program
                        </button>
                        <button className={`portal-nav-item ${activePortalTab === 'KYC' ? 'active' : ''}`} onClick={() => setActivePortalTab('KYC')}>
                            <ShieldCheck size={16} /> KYC Status
                        </button>
                        <button className={`portal-nav-item ${activePortalTab === 'Clients' ? 'active' : ''}`} onClick={() => setActivePortalTab('Clients')}>
                            <Users size={16} /> Clients
                        </button>
                        <button className={`portal-nav-item ${activePortalTab === 'Wallet' ? 'active' : ''}`} onClick={() => setActivePortalTab('Wallet')}>
                            <Wallet size={16} /> Wallet
                        </button>
                    </nav>
                </div>
                <div className="ib-portal-content">
                    {renderPortalContent()}
                </div>
            </div>
        );
    }

    // Default Registration View
    return (
        <div className="ib-reg-area">
            {notification && (
                <div className={`notification-pop ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    {notification.message}
                </div>
            )}
            <div className="ib-form-card">
                <div className="ib-form-header">
                    <h2>Become an Introducing Broker</h2>
                    <div className="step-dots">
                        <div className={`dot ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'done' : ''}`}>1</div>
                        <div className={`dot-line ${currentStep > 1 ? 'done' : ''}`}></div>
                        <div className={`dot ${currentStep === 2 ? 'active' : ''}`}>2</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="ib-signup-form">
                    {currentStep === 1 ? (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input name="firstName" value={formData.firstName} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input name="lastName" value={formData.lastName} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input disabled value={formData.email} className="disabled-input" />
                                </div>
                                <div className="form-group">
                                    <label>WhatsApp Number</label>
                                    <input name="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Languages Spoken</label>
                                <input name="languages" value={formData.languages} onChange={handleInputChange} placeholder="English, Arabic, etc." />
                            </div>
                            <button type="button" className="ib-primary-btn" onClick={() => setCurrentStep(2)}>Next</button>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Previous Experience (Optional)</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
                            </div>
                            <div className="file-upload-row">
                                <div className="file-upload-item">
                                    <label>Proof of Identity</label>
                                    <div className="custom-upload">
                                        <input type="file" id="id-up" name="nationalIdFile" onChange={handleFileChange} />
                                        <label htmlFor="id-up"><Upload size={16} /> {files.nationalIdFile?.name || 'Upload ID'}</label>
                                    </div>
                                </div>
                                <div className="file-upload-item">
                                    <label>Proof of Address</label>
                                    <div className="custom-upload">
                                        <input type="file" id="addr-up" name="addressProofFile" onChange={handleFileChange} />
                                        <label htmlFor="addr-up"><Upload size={16} /> {files.addressProofFile?.name || 'Upload Doc'}</label>
                                    </div>
                                </div>
                            </div>
                            <div className="ib-btn-row">
                                <button type="button" className="ib-secondary-btn" onClick={() => setCurrentStep(1)}>Back</button>
                                <button type="submit" className="ib-primary-btn">
                                    {loading ? <Loader2 className="spin" size={18} /> : 'Submit Application'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
