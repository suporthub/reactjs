import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, AlertTriangle } from 'lucide-react';

const CRYPTO_ICONS = {
    usdt: (
        <svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="12" fill="#26A17B"/><path d="M12.9 8.649h4.341V5.75H6.759v2.899h4.341v3.315c-2.317.202-4.103.886-4.103 1.704 0 .817 1.786 1.5 4.103 1.702v3.834h2.464V15.37c2.317-.202 4.105-.885 4.105-1.702 0-.818-1.788-1.502-4.105-1.704V8.649zm-1.047 5.161c-1.897 0-3.486-.346-3.791-.806.305-.461 1.894-.808 3.791-.808s3.486.347 3.791.808c-.305.46-1.894.806-3.791.806z" fill="#FFF"/></svg>
    ),
    usdc: (
        <svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="12" fill="#2775CA"/><path d="M11.517 7.206h1.002v1.545c1.472.062 2.656.772 3.1 1.954l-1.637.601c-.26-.649-.933-1.034-1.801-1.034-1.125 0-1.77.585-1.77 1.309 0 .8.625 1.155 1.597 1.48L12.597 13.253c1.554.524 2.508 1.258 2.508 2.569 0 1.201-.9 2.064-2.586 2.215v1.657h-1.002v-1.625c-1.683-.111-2.903-.91-3.327-2.221l1.65-.634c.265.807 1.05 1.354 1.986 1.354 1.238 0 1.921-.634 1.921-1.4 0-.877-.611-1.258-1.76-1.64l-.56-.187c-1.666-.556-2.527-1.34-2.527-2.617 0-1.171.954-2.003 2.617-2.14V7.206z" fill="#FFF"/></svg>
    ),
    bsc: (
        <svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="12" fill="#F3BA2F"/><path d="M9.112 10.155l2.843-2.835 2.859 2.835 1.637-1.611-4.496-4.496-4.481 4.496 1.638 1.611zm5.702 3.593l-2.843 2.835-2.859-2.835-1.637 1.611 4.496 4.496 4.481-4.496-1.638-1.611zm-2.843-3.528l-2.072 2.052 2.072 2.046 2.072-2.046-2.072-2.052zM5.56 12.207l1.637-1.611-1.637-1.611-1.638 1.611 1.638 1.611zm12.822-1.611l-1.637 1.611 1.637 1.611 1.638-1.611-1.638-1.611z" fill="#FFF"/></svg>
    ),
    eth: (
        <svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="12" fill="#627EEA"/><path fill="#FFF" d="M12.016 4.3v5.632l4.802 2.146-4.802-7.778zm-4.8 7.778l4.8-2.146V4.3l-4.8 7.778zM12.016 19.7V14.1l4.802-2.827-4.802 8.427zm-4.8-8.427L12.016 14.1v5.6L7.216 11.273zm4.8-1.121v3.313l4.8-2.828-4.8-.485zm-4.8.485l4.8 2.828v-3.313l-4.8.485z"/></svg>
    ),
    trx: (
        <svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="12" fill="#EB1C24"/><path d="M12 5.097L7.52 7.37 12 8.448l4.48-1.077L12 5.097zM6.504 7.37v.001L11.077 15.655V8.448L6.504 7.37zm5.496 1.078v7.207l4.573-8.285L12 8.448z" fill="#FFF"/></svg>
    ),
    matic: (
        <svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="12" fill="#8247E5"/><path fill="#FFF" d="M15.42 11.812l-1.89-1.085-1.895 1.085v2.17l1.895 1.085 1.89-1.085v-2.17zM9.742 8.558l-1.89-1.085-1.895 1.085v2.17l1.895 1.085 1.89-1.085v-2.17z"/><path fill="#FFF" d="M15.42 7.472l1.89-1.085V4.218l-1.89-1.085-1.895 1.085v2.17L15.42 7.472zm-7.573 8.683l-1.89 1.085v2.17l1.89 1.085 1.895-1.085v-2.17l-1.895-1.085zM11.636 15.068l1.895 1.085 1.89-1.085v-2.17l-1.89-1.085-1.895 1.085v2.17z"/></svg>
    )
};

const CryptoCustomSelect = ({ label, options, value, onChange, placeholder }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="form-group-wallet crypto-custom-select-container" ref={dropdownRef}>
            <label>{label}</label>
            <div 
                className={`crypto-select-btn ${isOpen ? 'active' : ''} ${value ? 'has-value' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOption ? (
                    <div className="crypto-select-value">
                        {selectedOption.svgIcon && (
                            <div className="crypto-svg-wrapper">
                                {CRYPTO_ICONS[selectedOption.svgIcon]}
                            </div>
                        )}
                        <span>{t(selectedOption.label)}</span>
                    </div>
                ) : (
                    <div className="crypto-select-placeholder">{t(placeholder || 'Select an option')}</div>
                )}
                <ChevronDown size={18} className={`crypto-chevron ${isOpen ? 'open' : ''}`} />
            </div>

            {isOpen && (
                <div className="crypto-dropdown-menu">
                    {options.map((opt) => (
                        <div 
                            key={opt.value}
                            className={`crypto-dropdown-item ${opt.value === value ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            {opt.svgIcon && (
                                <div className="crypto-svg-wrapper">
                                    {CRYPTO_ICONS[opt.svgIcon]}
                                </div>
                            )}
                            <span>{t(opt.label)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function CryptoWithdraw() {
    const { t } = useTranslation();
    const [currency, setCurrency] = useState('usdt');
    const [network, setNetwork] = useState('bsc');
    const [account, setAccount] = useState('live');

    const currencyOptions = [
        { value: 'usdt', label: 'USDT', svgIcon: 'usdt' },
        { value: 'usdc', label: 'USDC', svgIcon: 'usdc' },
    ];

    const networkOptions = [
        { value: 'bsc', label: 'Binance Smart Chain (BSC)', svgIcon: 'bsc' },
        { value: 'trx', label: 'TRON (TRX)', svgIcon: 'trx' },
        { value: 'eth', label: 'Ethereum (ETH)', svgIcon: 'eth' },
        { value: 'matic', label: 'Polygon (MATIC)', svgIcon: 'matic' },
    ];

    const accountOptions = [
        { value: 'live', label: 'Main Trading Account (live)' },
        { value: 'sp1', label: 'ednndjfjfjf (SP)' },
        { value: 'sp2', label: 'sjsjjdjdjfjfj (SP)' },
        { value: 'sp3', label: 'kodidela_111 (SP)' },
    ];

    return (
        <div className="deposit-form-split-layout">
            <div className="deposit-form-left text-fields-wrapper">
                
                <CryptoCustomSelect 
                    label={t("Select Currency")} 
                    options={currencyOptions} 
                    value={currency} 
                    onChange={setCurrency} 
                />

                <CryptoCustomSelect 
                    label={t("Select Network")} 
                    options={networkOptions} 
                    value={network} 
                    onChange={setNetwork} 
                />

                <CryptoCustomSelect 
                    label={t("Select Account")} 
                    options={accountOptions} 
                    value={account} 
                    onChange={setAccount} 
                />

                <div className="form-group-wallet">
                    <label>{t('Wallet Address')}</label>
                    <input type="text" placeholder={t("Enter strictly correct wallet address")} className="wallet-input" />
                </div>

                <div className="form-group-wallet">
                    <label>{t('Memo (If applicable)')}</label>
                    <input type="text" placeholder={t("Enter memo tag")} className="wallet-input" />
                </div>

                <div className="form-group-wallet">
                    <label>{t('Amount (USD)')}</label>
                    <input type="number" placeholder={t("Enter amount to withdraw")} className="wallet-input" />
                </div>

                <button className="primary-wallet-btn" style={{ marginTop: 'auto' }}>
                    {t('Withdraw Request')}
                </button>
            </div>

            <div className="deposit-form-right extra-info-wrapper">
                <div className="crypto-important-notice">
                    <div className="notice-header">
                        <AlertTriangle size={20} className="notice-icon" />
                        <span>{t('Important Notice:')}</span>
                    </div>
                    <ul className="notice-points">
                        <li>{t('Only send to the exact wallet address provided')}</li>
                        <li>{t('Double-check the wallet address before confirming')}</li>
                        <li>{t('We are not responsible for incorrect wallet addresses')}</li>
                        <li>{t('Ensure the wallet belongs to your registered name')}</li>
                        <li>{t('Minimum withdrawal amount may apply')}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
