import React from 'react';
import { ShieldCheck, CheckCircle, AlertCircle, FileText, ArrowRight } from 'lucide-react';

export default function IBKycStatus({ ibData }) {
    const status = ibData?.kycStatus || 'none';
    
    return (
        <div className="ib-kyc-status-view">
            <div className="portal-section-header">
                <h3>Verification Status</h3>
                <p>Monitor your identity and partnership verification status.</p>
            </div>

            <div className={`status-highlight-card ${status}`}>
                <div className="status-main-icon">
                    {status === 'approved' ? <ShieldCheck size={32} /> : status === 'pending' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                </div>
                <div className="status-meta">
                    <h4>{status.toUpperCase()}</h4>
                    <p>
                        {status === 'approved' ? 'Your IB partnership is fully verified and active.' : 
                         status === 'pending' ? 'Your identity documents are currently under review by our compliance team.' : 
                         'Your IB profile needs further verification.'}
                    </p>
                </div>
                {status === 'approved' && <div className="verification-check"><CheckCircle size={18} /> Verified</div>}
            </div>

            <div className="kyc-documents-grid">
                <div className="doc-mini-card">
                    <FileText size={18} />
                    <div className="doc-text">
                        <span>Proof of Identity</span>
                        <strong>Passport / National ID</strong>
                    </div>
                    {status === 'approved' && <CheckCircle size={14} color="#10b981" />}
                </div>
                <div className="doc-mini-card">
                    <FileText size={18} />
                    <div className="doc-text">
                        <span>Proof of Address</span>
                        <strong>Utility Bill / Bank Statement</strong>
                    </div>
                    {status === 'approved' && <CheckCircle size={14} color="#10b981" />}
                </div>
            </div>

            <div className="kyc-compliance-notice">
                <div className="notice-icon-box">
                    <ShieldCheck size={18} />
                </div>
                <div className="notice-text">
                    <h5>Compliance Standards</h5>
                    <p>LiveFXHub maintains strict anti-money laundering (AML) and know-your-customer (KYC) standards to ensure a secure partnership ecosystem.</p>
                </div>
            </div>

            <button className="view-app-btn">
                <span>View Full Application</span>
                <ArrowRight size={14} />
            </button>
        </div>
    );
}
