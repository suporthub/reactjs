import React from 'react';
import { ShieldCheck, Smartphone, Key } from 'lucide-react';

export default function Security() {
  return (
    <div className="settings-security-view">
      <h2>Security Settings</h2>

      <div className="settings-section-card">
        <div className="security-item">
          <div className="security-info">
            <h4>Password</h4>
            <p>Change your password to keep your account secure.</p>
          </div>
          <button className="security-action-btn">Change</button>
        </div>

        <div className="security-item">
          <div className="security-info">
            <h4>Two-Factor Authentication</h4>
            <p>Add an extra layer of security to your account.</p>
          </div>
          <button className="security-action-btn">Enable</button>
        </div>

        <div className="security-item">
          <div className="security-info">
            <h4>Active Sessions</h4>
            <p>Manage and sign out of your active sessions on other devices.</p>
          </div>
          <button className="security-action-btn">Manage</button>
        </div>
      </div>
    </div>
  );
}
