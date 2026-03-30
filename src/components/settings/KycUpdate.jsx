import React from 'react';
import { ArrowUpRight, BadgeCheck, Clock3, FileText, UploadCloud } from 'lucide-react';

export default function KycUpdate() {
  return (
    <div className="settings-kyc-view">
      <h2>KYC Update</h2>

      <div className="settings-section-card kyc-hero-card">
        <div className="kyc-hero-copy">
          <div className="kyc-status-badge">
            <Clock3 size={14} />
            Pending review
          </div>
          <h3>Keep your account verification details current</h3>
          <p>
            Update your identity documents and profile details to keep deposits, withdrawals,
            and account access running smoothly.
          </p>
          <div className="kyc-action-row">
            <button className="kyc-primary-btn">
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
            <strong>Passport uploaded</strong>
          </div>
          <div className="kyc-summary-item">
            <span>Proof of Address</span>
            <strong>Required</strong>
          </div>
          <div className="kyc-summary-item">
            <span>Review ETA</span>
            <strong>Within 24 hours</strong>
          </div>
        </div>
      </div>

      <div className="settings-section-card">
        <div className="card-header-with-action">
          <div>
            <h3 className="kyc-section-title">Required Steps</h3>
            <p className="kyc-section-subtitle">Complete each item to finish your KYC profile.</p>
          </div>
        </div>

        <div className="kyc-checklist">
          <div className="kyc-check-item complete">
            <div className="kyc-check-icon">
              <BadgeCheck size={16} />
            </div>
            <div className="kyc-check-copy">
              <h4>Personal details confirmed</h4>
              <p>Your profile information matches your submitted account details.</p>
            </div>
          </div>

          <div className="kyc-check-item">
            <div className="kyc-check-icon">
              <UploadCloud size={16} />
            </div>
            <div className="kyc-check-copy">
              <h4>Upload proof of address</h4>
              <p>Submit a recent utility bill, bank statement, or government-issued document.</p>
            </div>
            <button className="kyc-inline-btn">
              Update
              <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="kyc-check-item">
            <div className="kyc-check-icon">
              <FileText size={16} />
            </div>
            <div className="kyc-check-copy">
              <h4>Review submitted information</h4>
              <p>Make sure your name, address, and supporting files are clear and up to date.</p>
            </div>
            <button className="kyc-inline-btn">
              View
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
