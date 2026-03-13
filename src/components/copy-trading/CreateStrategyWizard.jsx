import React from 'react';
import { Users, Eye } from 'lucide-react';

export default function CreateStrategyWizard({ onBack }) {
    const [wizardStep, setWizardStep] = React.useState(1);

    const [visibilityType, setVisibilityType] = React.useState('public');
    const [wizardPassword, setWizardPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);

    const isLengthValid = wizardPassword.length >= 8 && wizardPassword.length <= 15;
    const isCaseValid = /[A-Z]/.test(wizardPassword) && /[a-z]/.test(wizardPassword);
    const isNumberValid = /[0-9]/.test(wizardPassword);
    const isSpecialValid = /[~`!@#$%^&*()_\-+={[}\]|\:;"'<,>.?/]/.test(wizardPassword);
    const isPwdDirty = wizardPassword.length > 0;
    const isPasswordValid = isLengthValid && isCaseValid && isNumberValid && isSpecialValid;

    const [strategyName, setStrategyName] = React.useState('');
    const [strategyDesc, setStrategyDesc] = React.useState('');

    // Picture validation
    const fileInputRef = React.useRef(null);
    const [profilePic, setProfilePic] = React.useState(null);
    const [picSizeValid, setPicSizeValid] = React.useState(false);
    const [picTypeValid, setPicTypeValid] = React.useState(false);
    const [picResValid, setPicResValid] = React.useState(false);
    const [picDirty, setPicDirty] = React.useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPicDirty(true);

        const isTypeValid = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
        setPicTypeValid(isTypeValid);

        const isSizeValid = file.size <= 2 * 1024 * 1024;
        setPicSizeValid(isSizeValid);

        if (isTypeValid) {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const isResValid = img.width >= 500 && img.height >= 500;
                setPicResValid(isResValid);

                if (isTypeValid && isSizeValid && isResValid) {
                    setProfilePic(img.src);
                } else {
                    setProfilePic(null);
                }
            };
        } else {
            setPicResValid(false);
            setProfilePic(null);
        }
    };

    return (
        <React.Fragment>
            <div className="strategy-wizard-container">
                <div className="wizard-main-card">
                    {wizardStep === 1 && (
                        <div className="wizard-step-content">
                            <h2>Set strategy visibility</h2>
                            <p className="wizard-subtitle">Choose who can see your strategy. You can change these settings at any time.</p>

                            <div className="wizard-radio-group">
                                <label className={`wizard-radio-option ${visibilityType === 'public' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="public"
                                        checked={visibilityType === 'public'}
                                        onChange={() => setVisibilityType('public')}
                                    />
                                    <div className="wizard-radio-text">
                                        <strong>Public strategy</strong>
                                        <span>A public strategy can be viewed by anyone.</span>
                                    </div>
                                </label>

                                <label className={`wizard-radio-option ${visibilityType === 'private' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="private"
                                        checked={visibilityType === 'private'}
                                        onChange={() => setVisibilityType('private')}
                                    />
                                    <div className="wizard-radio-text">
                                        <strong>Private strategy</strong>
                                        <span>A private strategy is only accessible using a link. You can select who you choose to share the link with.</span>
                                    </div>
                                </label>
                            </div>

                            <div className="wizard-footer-actions">
                                <button className="btn-wizard-back" onClick={() => onBack()}>Back</button>
                                <button className="btn-wizard-continue" onClick={() => setWizardStep(2)}>Continue</button>
                            </div>
                        </div>
                    )}

                    {wizardStep === 2 && (
                        <div className="wizard-step-content">
                            <h2>Set up account</h2>
                            <p className="wizard-subtitle">Configure key parameters for the new strategy account. You can update these later.</p>

                            <div className="wizard-form-group">
                                <label>
                                    Performance fee
                                    <span className="fee-tooltip-wrapper">
                                        <span className="info-circle" style={{ width: '14px', height: '14px', fontSize: '10px', marginLeft: '4px' }}>i</span>
                                        <div className="fee-tooltip">
                                            Specify the performance fee (%) you want to receive from your investors' profits at the end of the billing period.
                                        </div>
                                    </span>
                                </label>
                                <div className="custom-select-wrapper">
                                    <select defaultValue="5%">
                                        <option value="5%">5%</option>
                                        <option value="10%">10%</option>
                                        <option value="15%">15%</option>
                                        <option value="20%">20%</option>
                                        <option value="25%">25%</option>
                                        <option value="30%">30%</option>
                                        <option value="35%">35%</option>
                                        <option value="40%">40%</option>
                                        <option value="45%">45%</option>
                                        <option value="50%">50%</option>
                                    </select>
                                </div>
                                <span className="field-hint">You can change performance fee later at any time</span>
                            </div>

                            <div className="wizard-form-group">
                                <label>Max leverage</label>
                                <div className="custom-select-wrapper dark-border">
                                    <select defaultValue="1:200">
                                        <option value="1:50">1:50</option>
                                        <option value="1:100">1:100</option>
                                        <option value="1:200">1:200</option>
                                    </select>
                                </div>
                            </div>

                            <div className="wizard-form-group">
                                <label>Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Your password"
                                        value={wizardPassword}
                                        onChange={(e) => setWizardPassword(e.target.value)}
                                    />
                                    <Eye
                                        size={18}
                                        className="password-eye-icon"
                                        onClick={() => setShowPassword(!showPassword)}
                                    />
                                </div>

                                <ul className="password-rules">
                                    <li className={isPwdDirty ? (isLengthValid ? 'rule-valid' : 'rule-invalid') : ''}>
                                        <span>{isPwdDirty ? (isLengthValid ? '✓' : 'X') : '◦'}</span> Between 8-15 characters
                                    </li>
                                    <li className={isPwdDirty ? (isCaseValid ? 'rule-valid' : 'rule-invalid') : ''}>
                                        <span>{isPwdDirty ? (isCaseValid ? '✓' : 'X') : '◦'}</span> At least one upper and one lower case letter
                                    </li>
                                    <li className={isPwdDirty ? (isNumberValid ? 'rule-valid' : 'rule-invalid') : ''}>
                                        <span>{isPwdDirty ? (isNumberValid ? '✓' : 'X') : '◦'}</span> At least one number
                                    </li>
                                    <li className={isPwdDirty ? (isSpecialValid ? 'rule-valid' : 'rule-invalid') : ''}>
                                        <span>{isPwdDirty ? (isSpecialValid ? '✓' : 'X') : '◦'}</span> At least one special character
                                    </li>
                                </ul>
                            </div>

                            <div className="wizard-footer-actions">
                                <button className="btn-wizard-back" onClick={() => setWizardStep(1)}>Back</button>
                                <button
                                    className="btn-wizard-continue"
                                    onClick={() => setWizardStep(3)}
                                    disabled={!isPasswordValid}
                                    style={{ opacity: !isPasswordValid ? 0.5 : 1, cursor: !isPasswordValid ? 'not-allowed' : 'pointer' }}
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {wizardStep === 3 && (
                        <div className="wizard-step-content">
                            <h2>Add name and description</h2>
                            <p className="wizard-subtitle">Provide a name and description that clearly explains your strategy's goals.</p>

                            <div className="wizard-form-group">
                                <label>Strategy name</label>
                                <div className={`password-input-wrapper ${strategyName.length > 0 && strategyName.length < 10 ? 'error-border' : ''}`}>
                                    <input
                                        type="text"
                                        placeholder="Enter strategy name"
                                        value={strategyName}
                                        onChange={(e) => setStrategyName(e.target.value)}
                                        className={strategyName.length > 0 && strategyName.length < 10 ? 'error-input' : ''}
                                    />
                                </div>
                                {strategyName.length > 0 && strategyName.length < 10 && (
                                    <span className="error-text" style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        Must be at least 10 characters
                                    </span>
                                )}
                            </div>

                            <div className="wizard-form-group">
                                <label>Description</label>
                                <textarea
                                    className="wizard-textarea"
                                    placeholder="Describe your strategy for your investors"
                                    value={strategyDesc}
                                    onChange={(e) => setStrategyDesc(e.target.value)}
                                    rows={6}
                                />
                            </div>

                            <div className="wizard-footer-actions">
                                <button className="btn-wizard-back" onClick={() => setWizardStep(2)}>Back</button>
                                <button
                                    className="btn-wizard-continue"
                                    onClick={() => setWizardStep(4)}
                                    disabled={strategyName.length < 10 || strategyDesc.trim().length === 0}
                                    style={{ opacity: strategyName.length < 10 || strategyDesc.trim().length === 0 ? 0.5 : 1, cursor: strategyName.length < 10 || strategyDesc.trim().length === 0 ? 'not-allowed' : 'pointer' }}
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {wizardStep === 4 && (
                        <div className="wizard-step-content">
                            <h2>Add profile picture</h2>
                            <p className="wizard-subtitle">Personalize your strategy with an attractive profile picture to stand out.</p>

                            <div className="wizard-upload-area" style={{ alignItems: 'flex-start' }}>
                                <div className="upload-avatar-circle" style={{ overflow: 'hidden' }}>
                                    {profilePic ? (
                                        <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Users size={40} color="#b1baca" />
                                    )}
                                </div>
                                <div className="upload-actions">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                        accept="image/png, image/jpeg, image/jpg"
                                    />
                                    <button className="btn-upload" onClick={() => fileInputRef.current.click()}>Upload photo</button>
                                    <p className="upload-hint">Recommended resolution 500x500px. Max 2MB.</p>
                                    <ul className="password-rules" style={{ marginTop: '12px' }}>
                                        <li className={picDirty ? (picTypeValid ? 'rule-valid' : 'rule-invalid') : ''}>
                                            <span>{picDirty ? (picTypeValid ? '✓' : 'X') : '◦'}</span> JPG, JPEG, or PNG format
                                        </li>
                                        <li className={picDirty ? (picSizeValid ? 'rule-valid' : 'rule-invalid') : ''}>
                                            <span>{picDirty ? (picSizeValid ? '✓' : 'X') : '◦'}</span> Maximum file size of 2MB
                                        </li>
                                        <li className={picDirty ? (picResValid ? 'rule-valid' : 'rule-invalid') : ''}>
                                            <span>{picDirty ? (picResValid ? '✓' : 'X') : '◦'}</span> Minimum resolution 500x500px
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="wizard-footer-actions">
                                <button className="btn-wizard-back" onClick={() => setWizardStep(3)}>Back</button>
                                <button
                                    className="btn-wizard-continue"
                                    onClick={() => {
                                        alert("Strategy Created Successfully!");
                                        onBack();
                                        setWizardStep(1);
                                    }}
                                    disabled={picDirty && (!picSizeValid || !picTypeValid || !picResValid)}
                                    style={{
                                        opacity: (picDirty && (!picSizeValid || !picTypeValid || !picResValid)) ? 0.5 : 1,
                                        cursor: (picDirty && (!picSizeValid || !picTypeValid || !picResValid)) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Finish & Create
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="wizard-sidebar-steps">
                    <div className="wizard-step-item">
                        <div className={`step-circle ${wizardStep > 1 ? 'completed' : 'active'}`}>
                            {wizardStep > 1 ? <span style={{ color: '#fff' }}>&#10003;</span> : '1'}
                        </div>
                        <div className="step-text-col">
                            <span className={`step-label ${wizardStep === 1 ? 'bold-label' : ''}`}>Set strategy visibility</span>
                            <span className="step-desc">Choose public or private</span>
                        </div>
                        <div className="step-line" style={{ background: wizardStep > 1 ? '#22c55e' : 'var(--border-color)' }}></div>
                    </div>
                    <div className="wizard-step-item">
                        <div className={`step-circle ${wizardStep > 2 ? 'completed' : wizardStep === 2 ? 'active' : ''}`}>
                            {wizardStep > 2 ? <span style={{ color: '#fff' }}>&#10003;</span> : '2'}
                        </div>
                        <div className="step-text-col">
                            <span className={`step-label ${wizardStep === 2 ? 'bold-label' : ''}`}>Set up account</span>
                            <span className="step-desc">Select account type</span>
                        </div>
                        <div className="step-line" style={{ background: wizardStep > 2 ? '#22c55e' : 'var(--border-color)' }}></div>
                    </div>
                    <div className="wizard-step-item">
                        <div className={`step-circle ${wizardStep > 3 ? 'completed' : wizardStep === 3 ? 'active' : ''}`}>
                            {wizardStep > 3 ? <span style={{ color: '#fff' }}>&#10003;</span> : '3'}
                        </div>
                        <div className="step-text-col">
                            <span className={`step-label ${wizardStep === 3 ? 'bold-label' : ''}`}>Add name and description</span>
                            <span className="step-desc">Add name, write description</span>
                        </div>
                        <div className="step-line" style={{ background: wizardStep > 3 ? '#22c55e' : 'var(--border-color)' }}></div>
                    </div>
                    <div className="wizard-step-item">
                        <div className={`step-circle ${wizardStep === 4 ? 'active' : ''}`}>4</div>
                        <div className="step-text-col">
                            <span className={`step-label ${wizardStep === 4 ? 'bold-label' : ''}`}>Add profile picture</span>
                            <span className="step-desc">Upload image</span>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}
