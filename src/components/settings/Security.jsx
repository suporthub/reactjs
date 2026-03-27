import React, { useState, useEffect } from 'react';
import { ShieldCheck, Smartphone, Key, Mail, ChevronDown, Check, X, Copy, RefreshCw } from 'lucide-react';

export default function Security() {
  const [show2FA, setShow2FA] = useState(false);
  const [showTotpModal, setShowTotpModal] = useState(false);
  const [totpStep, setTotpStep] = useState(1); // 1: Setup, 2: Verify
  const [totpData, setTotpData] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showStatus = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleSetupTotp = async () => {
    setLoading(true);
    const token = localStorage.getItem('portalToken');
    const fingerprint = localStorage.getItem('deviceFingerprint');

    try {
      const response = await fetch('https://v3.livefxhub.com:8444/api/auth/totp/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Device-Fingerprint': fingerprint
        }
      });
      const result = await response.json();
      if (result.success) {
        setTotpData(result.data);
        setShowTotpModal(true);
        setTotpStep(1);
      } else {
        showStatus(result.message || 'Setup failed', 'error');
      }
    } catch (error) {
      showStatus('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTotp = async () => {
    if (otpValue.length !== 6) {
      showStatus('Please enter 6-digit code', 'error');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('portalToken');
    const fingerprint = localStorage.getItem('deviceFingerprint');

    try {
      const response = await fetch('https://v3.livefxhub.com:8444/api/auth/totp/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Device-Fingerprint': fingerprint
        },
        body: JSON.stringify({ code: otpValue })
      });
      const result = await response.json();
      if (result.success) {
        showStatus(result.message || '2FA enabled successfully!');
        setShowTotpModal(false);
        setOtpValue('');
        // Force refresh user data to show correct state if needed?
      } else {
        showStatus(result.message || 'Verification failed', 'error');
      }
    } catch (error) {
      showStatus('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-security-view">
      {/* Snackbar Notification */}
      {notification && (
        <div className={`settings-snackbar ${notification.type}`}>
          {notification.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      <h2>Security Settings</h2>

      <div className="settings-section-card">
        <div className="security-item">
          <div className="security-info">
            <h4>Password</h4>
            <p>Change your password to keep your account secure.</p>
          </div>
          <button className="security-action-btn">Change</button>
        </div>

        <div className="security-item-group">
          <div className="security-item">
            <div className="security-info">
              <h4>Two-Factor Authentication</h4>
              <p>Add an extra layer of security to your account.</p>
            </div>
            <button
              className={`security-action-btn ${show2FA ? 'active' : ''}`}
              onClick={() => setShow2FA(!show2FA)}
            >
              Options
            </button>
          </div>

          {show2FA && (
            <div className="two-fa-options-dropdown">
              <div className="two-fa-item">
                <div className="two-fa-label">
                  <Mail size={16} />
                  <span>Email 2FA</span>
                </div>
                <button className="mini-enable-btn">Enable</button>
              </div>
              <div className="two-fa-item">
                <div className="two-fa-label">
                  <Smartphone size={16} />
                  <span>Google Authenticator</span>
                </div>
                <button
                  className="mini-enable-btn"
                  onClick={handleSetupTotp}
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="spin" size={14} /> : 'Enable'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="security-item">
          <div className="security-info">
            <h4>Active Sessions</h4>
            <p>Manage and sign out of your active sessions on other devices.</p>
          </div>
          <button className="security-action-btn">Manage</button>
        </div>
      </div>

      {/* TOTP Setup Modal */}
      {showTotpModal && (
        <div className="security-modal-overlay">
          <div className="security-modal-content">
            <div className="modal-header">
              <h3>Google Authenticator</h3>
              <button onClick={() => setShowTotpModal(false)}><X size={20} /></button>
            </div>

            <div className="modal-body">
              {totpStep === 1 ? (
                <div className="totp-setup-step">
                  <p className="step-desc">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>

                  <div className="qr-container">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(totpData.otpauthUrl)}&size=200x200&bgcolor=ffffff`}
                      alt="TOTP QR Code"
                    />
                  </div>

                  <div className="manual-entry">
                    <span className="manual-label">Unable to scan? Copy secret key:</span>
                    <div className="secret-code-box">
                      <code>{totpData.otpauthUrl.split('secret=')[1].split('&')[0]}</code>
                      <button onClick={() => {
                        navigator.clipboard.writeText(totpData.otpauthUrl.split('secret=')[1].split('&')[0]);
                        showStatus('Secret copied to clipboard');
                      }}><Copy size={14} /></button>
                    </div>
                  </div>

                  <button className="modal-primary-btn" onClick={() => setTotpStep(2)}>Setup</button>
                </div>
              ) : (
                <div className="totp-verify-step">
                  <p className="step-desc">Enter the 6-digit code from your authenticator app to complete setup.</p>

                  <div className="otp-input-wrapper">
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="000000"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div className="modal-footer-btns">
                    <button className="modal-secondary-btn" onClick={() => setTotpStep(1)}>Back</button>
                    <button
                      className="modal-primary-btn"
                      onClick={handleConfirmTotp}
                      disabled={loading || otpValue.length !== 6}
                    >
                      {loading ? 'Verifying...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
