import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Check, 
  X, 
  Copy, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Monitor, 
  MapPin, 
  Globe, 
  Clock, 
  LogOut,
  ShieldCheck,
  Lock
} from 'lucide-react';

export default function Security() {
  const [show2FA, setShow2FA] = useState(false);
  const [showTotpModal, setShowTotpModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [otpDisableValue, setOtpDisableValue] = useState(['', '', '', '', '', '']);
  
  const [totpStep, setTotpStep] = useState(1);
  const [totpData, setTotpData] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  
  // Active Sessions State
  const [sessionsData, setSessionsData] = useState([]);
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Cache data
  const userDataStr = localStorage.getItem('userData');
  const userData = userDataStr ? JSON.parse(userDataStr) : null;
  const is2faEnabled = userData?.is2faEnabled || false;

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showStatus = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const fetchSessions = async () => {
    setLoading(true);
    const token = localStorage.getItem('portalToken');
    try {
      const response = await fetch('https://v3.livefxhub.com:8444/api/live/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success || result.status === 'success') {
        setSessionsData(result.data || []);
        setShowSessionsModal(true);
      } else {
        showStatus(result.message || 'Failed to fetch sessions', 'error');
      }
    } catch (error) {
      showStatus('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showStatus('New passwords do not match', 'error');
      return;
    }
    setLoading(true);
    const token = localStorage.getItem('portalToken');
    try {
      const response = await fetch('https://v3.livefxhub.com:8444/api/live/password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const result = await response.json();
      if (result.success || result.status === 'success') {
        showStatus('Password changed successfully!');
        setShowPasswordModal(false);
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        showStatus(result.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      showStatus('Network error', 'error');
    } finally {
      setLoading(false);
    }
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
    if (otpValue.length !== 6) return;
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
        showStatus('2FA enabled successfully!');
        const updatedUser = { ...userData, is2faEnabled: true };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        setShowTotpModal(false);
        setOtpValue('');
      } else {
        showStatus(result.message || 'Verification failed', 'error');
      }
    } catch (error) {
      showStatus('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    setLoading(true);
    const token = localStorage.getItem('portalToken');
    try {
      const response = await fetch(`https://v3.livefxhub.com:8444/api/live/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success || result.status === 'success') {
        showStatus('Session terminated successfully');
        setSessionsData(prev => prev.filter(s => s.id !== sessionId));
      } else {
        showStatus(result.message || 'Failed to terminate session', 'error');
      }
    } catch (error) {
      showStatus('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpDisableValue];
    newOtp[index] = value;
    setOtpDisableValue(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-disable-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDisableValue[index] && index > 0) {
      const prevInput = document.getElementById(`otp-disable-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
    if (e.key === 'Enter') {
      handleDisable2FA();
    }
  };

  return (
    <div className="settings-security-view">
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
          <button className="security-action-btn" onClick={() => setShowPasswordModal(true)}>Change</button>
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
                  <Smartphone size={16} />
                  <span>Google Authenticator</span>
                </div>
                <button
                  className={`mini-enable-btn ${is2faEnabled ? 'disable' : ''}`}
                  onClick={is2faEnabled ? () => setShowDisable2FAModal(true) : handleSetupTotp}
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="spin" size={14} /> : (is2faEnabled ? 'Disable' : 'Enable')}
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
          <button className="security-action-btn" onClick={fetchSessions} disabled={loading}>
            {loading && !showSessionsModal ? 'Fetching...' : 'Manage'}
          </button>
        </div>
      </div>

      {/* Disable 2FA Modal */}
      {showDisable2FAModal && (
        <div className="security-modal-overlay">
          <div className="security-modal-content small">
            <div className="modal-header">
              <h3>Disable 2FA?</h3>
              <button onClick={() => setShowDisable2FAModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body align-center">
              <ShieldCheck size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
              <p className="step-desc" style={{ textAlign: 'center', marginBottom: '24px' }}>
                Enter the 6-digit code from your authenticator app to disable Two-Factor Authentication.
              </p>
              
              <div className="otp-disable-grid">
                {otpDisableValue.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-disable-${idx}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="otp-small-box"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <div className="modal-footer-btns-center" style={{ marginTop: '30px' }}>
                <button 
                  className="modal-secondary-btn" 
                  onClick={() => setShowDisable2FAModal(false)}
                  disabled={loading}
                >
                  No, Keep it
                </button>
                <button 
                  className="modal-primary-btn delete" 
                  onClick={handleDisable2FA}
                  disabled={loading || otpDisableValue.join('').length !== 6}
                >
                  {loading ? 'Verifying...' : 'Yes, Disable it'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions Modal */}
      {showSessionsModal && (
        <div className="security-modal-overlay">
          <div className="security-modal-content premium-wide">
            <div className="modal-header">
              <div className="header-icon-title">
                <ShieldCheck className="header-main-icon" size={24} />
                <h3>Active Sessions</h3>
              </div>
              <button className="close-modal-btn" onClick={() => setShowSessionsModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body scrollable">
              <p className="step-desc">For security, monitor and sign out from other devices currently logged into your account.</p>
              <div className="sessions-list">
                {sessionsData.map((session) => (
                  <div key={session.id} className={`session-card-premium ${session.isCurrent ? 'current' : ''}`}>
                    <div className="session-icon-box-premium">
                      {session.deviceName.toLowerCase().includes('windows') || session.deviceName.toLowerCase().includes('mac') 
                        ? <Monitor size={22} /> : <Smartphone size={22} />}
                    </div>
                    <div className="session-info-main">
                      <div className="session-head">
                        <div className="title-group">
                          <strong>{session.deviceName}</strong>
                          <span className="device-tag">({session.deviceLabel || 'Verified Device'})</span>
                        </div>
                        {session.isCurrent && <span className="premium-current-badge">This Device</span>}
                      </div>
                      <div className="session-meta-grid">
                        <div className="meta-pill"><Globe size={11} /><span>{session.ipAddress}</span></div>
                        <div className="meta-pill"><MapPin size={11} /><span>{session.location || 'UAE'}</span></div>
                        <div className="meta-pill"><Clock size={11} /><span>{new Date(session.loginTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span></div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <button 
                        className="session-logout-btn" 
                        onClick={() => handleTerminateSession(session.id)}
                        disabled={loading}
                      >
                        <LogOut size={16} />
                        <span>{loading ? '...' : 'Logout'}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="security-modal-overlay">
          <div className="security-modal-content">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handlePasswordChange} className="modal-body">
              <div className="form-group-security">
                <label>Current Password</label>
                <div className="password-input-row">
                  <input type={showPass.current ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  <div className="eye-btn" onClick={() => setShowPass({...showPass, current: !showPass.current})}>
                    {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </div>
                </div>
              </div>
              <div className="form-group-security">
                <label>New Password</label>
                <div className="password-input-row">
                  <input type={showPass.new ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  <div className="eye-btn" onClick={() => setShowPass({...showPass, new: !showPass.new})}>
                    {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </div>
                </div>
              </div>
              <div className="form-group-security" style={{ marginBottom: '24px' }}>
                <label>Confirm New Password</label>
                <div className="password-input-row">
                  <input type={showPass.confirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  <div className="eye-btn" onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})}>
                    {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </div>
                </div>
              </div>
              <button type="submit" className="modal-primary-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}

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
                  <p className="step-desc">Scan this QR code with your authenticator app.</p>
                  <div className="qr-container">
                    {totpData && <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(totpData.otpauthUrl)}&size=200x200`} alt="QR" />}
                  </div>
                  <div className="manual-entry">
                    <div className="secret-code-box">
                      <code>{totpData?.otpauthUrl.split('secret=')[1].split('&')[0]}</code>
                      <button onClick={() => { navigator.clipboard.writeText(totpData?.otpauthUrl.split('secret=')[1].split('&')[0]); showStatus('Copied'); }}><Copy size={14} /></button>
                    </div>
                  </div>
                  <button className="modal-primary-btn" onClick={() => setTotpStep(2)}>Setup</button>
                </div>
              ) : (
                <div className="totp-verify-step">
                  <p className="step-desc">Enter 6-digit code.</p>
                  <div className="otp-input-wrapper">
                    <input type="text" maxLength="6" value={otpValue} onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div className="modal-footer-btns">
                    <button className="modal-secondary-btn" onClick={() => setTotpStep(1)}>Back</button>
                    <button className="modal-primary-btn" onClick={handleConfirmTotp} disabled={loading || otpValue.length !== 6}>
                      Confirm
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
