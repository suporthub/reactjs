import React from 'react';
import { Pencil } from 'lucide-react';

export default function Profile() {
  return (
    <div className="settings-profile-view">
      <h2>My Profile</h2>

      {/* Profile Header Card */}
      <div className="settings-section-card">
        <div className="card-header-with-action">
          <div className="profile-main-info">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nithin" 
              alt="Avatar" 
              className="profile-avatar-large" 
            />
            <div className="profile-details-text">
              <h3>Rafiqur Rahman</h3>
              <p>Team Manager</p>
              <p>Leeds, United Kingdom</p>
            </div>
          </div>
          <button className="settings-edit-btn">
            Edit <Pencil size={12} />
          </button>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="settings-section-card">
        <div className="card-header-with-action">
          <h3 className="info-label" style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '15px' }}>
            Personal Information
          </h3>
          <button className="settings-edit-btn">
            Edit <Pencil size={12} />
          </button>
        </div>
        
        <div className="info-grid">
          <div className="info-field-group">
            <span className="info-label">First Name</span>
            <span className="info-value">Rafiqur</span>
          </div>
          <div className="info-field-group">
            <span className="info-label">Last Name</span>
            <span className="info-value">Rahman</span>
          </div>
          <div className="info-field-group">
            <span className="info-label">Email Address</span>
            <span className="info-value">rafiqurrahman51@gmail.com</span>
          </div>
          <div className="info-field-group">
            <span className="info-label">Phone</span>
            <span className="info-value">+09 345 346 46</span>
          </div>
          <div className="info-field-group" style={{ gridColumn: 'span 2' }}>
            <span className="info-label">Bio</span>
            <span className="info-value">Team Manager</span>
          </div>
        </div>
      </div>

      {/* Address Card */}
      <div className="settings-section-card">
        <div className="card-header-with-action">
          <h3 className="info-label" style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '15px' }}>
            Address
          </h3>
          <button className="settings-edit-btn">
            Edit <Pencil size={12} />
          </button>
        </div>

        <div className="info-grid">
          <div className="info-field-group">
            <span className="info-label">Country</span>
            <span className="info-value">United Kingdom</span>
          </div>
          <div className="info-field-group">
            <span className="info-label">City/State</span>
            <span className="info-value">Leeds, East London</span>
          </div>
          <div className="info-field-group">
            <span className="info-label">Postal Code</span>
            <span className="info-value">ERT 2354</span>
          </div>
          <div className="info-field-group">
            <span className="info-label">TAX ID</span>
            <span className="info-value">AS45645756</span>
          </div>
        </div>
      </div>
    </div>
  );
}
