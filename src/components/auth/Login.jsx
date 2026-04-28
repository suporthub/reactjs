import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Globe, ChevronDown, X, Lock, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './login.css';
import { getDeviceFingerprint, getDeviceLabel } from '../../utils/fingerprint';

const translations = {
    english: {
        welcome: 'Welcome Back!',
        subtitle: 'Log in to start trading with ease.',
        email: 'Email',
        emailPlaceholder: 'Input your email',
        password: 'Password',
        passwordPlaceholder: 'Input your password',
        remember: 'Remember Me',
        forgot: 'Forgot Password?',
        login: 'Login',
        noAccount: "Don't have an account?",
        signup: 'Sign up here',
        backToWeb: 'Back to Website',
        promoH1: 'Trade Smarter. \nExecute Faster. \nProfit Anywhere.',
        promoP: 'From rapid market execution to deep institutional analytics, our powerful trading engine lets you work seamlessly across all your devices.',
        resetTitle: 'Reset Password',
        resetSubtitle: 'Enter your email address and we will send you an OTP code to reset your password.',
        sendBtn: 'Send OTP',
        close: 'Close',
        verifyTitle: 'Verify OTP',
        verifySubtitle: 'Enter the 6-digit code sent to your email.',
        updateTitle: 'New Password',
        updateSubtitle: 'Create a strong password with at least 8 characters.',
        updateBtn: 'Update Password',
        newPasswordPlaceholder: 'Enter new password',
        confirmPasswordPlaceholder: 'Confirm new password'
    },
    hindi: {
        welcome: 'वापसी पर स्वागत है!',
        subtitle: 'आसानी से ट्रेडिंग शुरू करने के लिए लॉग इन करें।',
        email: 'ईमेल',
        emailPlaceholder: 'अपना ईमेल डालें',
        password: 'पासवर्ड',
        passwordPlaceholder: 'अपना पासवर्ड डालें',
        remember: 'मुझे याद रखें',
        forgot: 'पासवर्ड भूल गए?',
        login: 'लॉग इन करें',
        noAccount: 'क्या आपके पास खाता नहीं है?',
        signup: 'यहाँ साइन अप करें',
        backToWeb: 'वेबसाइट पर वापस जाएं',
        promoH1: 'तेजी से ट्रेड करें। \nबेहतर लाभ और \nसुविधाजनक अनुभव।',
        promoP: 'रैपिड मार्केट निष्पादन से लेकर गहन संस्थागत विश्लेषण तक, हमारा शक्तिशाली ट्रेडिंग इंजन आपको अपने सभी उपकरणों पर निर्बाズ रूप से काम करने देता है।',
        resetTitle: 'पासवर्ड रीसेट करें',
        resetSubtitle: 'अपना ईमेल पता दर्ज करें और हम आपको पासवर्ड रीसेट करने के लिए एक ओटीपी कोड भेजेंगे।',
        sendBtn: 'ओटीपी भेजें',
        close: 'बंद करें',
        verifyTitle: 'ओटीपी सत्यापित करें',
        verifySubtitle: 'अपने ईमेल पर भेजा गया 6-अंकीय कोड दर्ज करें।',
        updateTitle: 'नया पासवर्ड',
        updateSubtitle: 'कम से कम 8 अक्षरों वाला एक मजबूत पासवर्ड बनाएं।',
        updateBtn: 'पासवर्ड अपडेट करें',
        newPasswordPlaceholder: 'नया पासवर्ड डालें',
        confirmPasswordPlaceholder: 'पासवर्ड की पुष्टि करें'
    },
    vietnam: {
        welcome: 'Chào mừng trở lại!',
        subtitle: 'Đăng nhập để bắt đầu giao dịch một cách dễ dàng.',
        email: 'Email',
        emailPlaceholder: 'Nhập email của bạn',
        password: 'Mật khẩu',
        passwordPlaceholder: 'Nhập mật khẩu của bạn',
        remember: 'Ghi nhớ đăng nhập',
        forgot: 'Quên mật khẩu?',
        login: 'Đăng nhập',
        noAccount: 'Chưa có tài khoản?',
        signup: 'Đăng ký tại đây',
        backToWeb: 'Quay lại Trang chủ',
        promoH1: 'Giao dịch Thông minh. \nThực thi Nhanh hơn. \nLợi nhuận Mọi nơi.',
        promoP: 'Từ việc khớp lệnh thị trường nhanh chóng đến các phân tích chuyên sâu, công cụ giao dịch mạnh mẽ của chúng tôi giúp bạn làm việc mượt mà trên mọi thiết bị.',
        resetTitle: 'Đặt lại mật khẩu',
        resetSubtitle: 'Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn mã OTP để đặt lại mật khẩu.',
        sendBtn: 'Gửi mã OTP',
        close: 'Đóng',
        verifyTitle: 'Xác minh OTP',
        verifySubtitle: 'Nhập mã 6 chữ số được gửi đến email của bạn.',
        updateTitle: 'Mật khẩu mới',
        updateSubtitle: 'Tạo mật khẩu mạnh với ít nhất 8 ký tự.',
        updateBtn: 'Cập nhật mật khẩu',
        newPasswordPlaceholder: 'Nhập mật khẩu mới',
        confirmPasswordPlaceholder: 'Xác nhận mật khẩu mới'
    },
    indonesian: {
        welcome: 'Selamat Datang Kembali!',
        subtitle: 'Masuk untuk mulai trading dengan mudah.',
        email: 'Email',
        emailPlaceholder: 'Masukkan email Anda',
        password: 'Kata Sandi',
        passwordPlaceholder: 'Masukkan kata sandi Anda',
        remember: 'Ingat Saya',
        forgot: 'Lupa Kata Sandi?',
        login: 'Masuk',
        noAccount: 'Belum punya akun?',
        signup: 'Daftar di sini',
        backToWeb: 'Kembali ke Situs Web',
        promoH1: 'Trading Lebih Pintar. \nEksekusi Lebih Cepat. \nProfit di Mana Saja.',
        promoP: 'Dari eksekusi pasar yang cepat hingga analitik institusional yang mendalam, mesin trading kami yang kuat memungkinkan Anda bekerja tanpa hambatan di semua perangkat Anda.',
        resetTitle: 'Atur Ulang Kata Sandi',
        resetSubtitle: 'Masukkan alamat email Anda dan kami akan mengirimkan kode OTP untuk mengatur ulang kata sandi Anda.',
        sendBtn: 'Kirim OTP',
        close: 'Tutup',
        verifyTitle: 'Verifikasi OTP',
        verifySubtitle: 'Masukkan 6 digit kode yang dikirim ke email Anda.',
        updateTitle: 'Kata Sandi Baru',
        updateSubtitle: 'Buat kata sandi yang kuat minimal 8 karakter.',
        updateBtn: 'Perbarui Kata Sandi',
        newPasswordPlaceholder: 'Masukkan kata sandi baru',
        confirmPasswordPlaceholder: 'Konfirmasi kata sandi baru'
    },
    arabic: {
        welcome: 'أهلاً بك مجدداً!',
        subtitle: 'قم بتسجيل الدخول لبدء التداول بسهولة.',
        email: 'البريد الإلكتروني',
        emailPlaceholder: 'أدخل بريدك الإلكتروني',
        password: 'كلمة المرور',
        passwordPlaceholder: 'أدخل كلمة المرور الخاصة بك',
        remember: 'تذكرني',
        forgot: 'هل نسيت كلمة المرور؟',
        login: 'تسجيل الدخول',
        noAccount: 'ليس لديك حساب؟',
        signup: 'سجل هنا',
        backToWeb: 'العودة للموقع',
        promoH1: 'تداول بذكاء. \nنفذ أسرع. \nاربح في كل مكان.',
        promoP: 'من تنفيذ السوق بسرعة إلى التحليلات المؤسسية العميقة، يتيح لك محرك التداول المطور لدينا العمل بسلاسة عبر جميع أجهزتك.',
        resetTitle: 'إعادة تعيين كلمة المرور',
        resetSubtitle: 'أدخل عنوان بريدك الإلكتروني وسنرسل لك رمز OTP لإعادة تعيين كلمة مرورك.',
        sendBtn: 'إرسال رمز OTP',
        close: 'إغلاق',
        verifyTitle: 'تفعيل الرمز',
        verifySubtitle: 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك.',
        updateTitle: 'كلمة مرور جديدة',
        updateSubtitle: 'أنشئ كلمة مرور قوية مكونة من 8 أحرف على الأقل.',
        updateBtn: 'تحديث كلمة المرور',
        newPasswordPlaceholder: 'أدخل كلمة المرور الجديدة',
        confirmPasswordPlaceholder: 'تأكيد كلمة المرور الجديدة'
    },
    urdu: {
        welcome: 'خوش آمدید!',
        subtitle: 'آسانی کے ساتھ ٹریڈنگ شروع کرنے کے لیے لاگ ان کریں۔',
        email: 'ای میل',
        emailPlaceholder: 'اپنا ای میل درج کریں',
        password: 'پاس ورڈ',
        passwordPlaceholder: 'اپنا پاس ورڈ درج کریں',
        remember: 'مجھے یاد رکھیں',
        forgot: 'پاس ورڈ بھول گئے؟',
        login: 'لاگ ان کریں',
        noAccount: 'کیا آپ کے پاس اکاؤنٹ نہیں ہے؟',
        signup: 'یہاں سائن اپ کریں',
        backToWeb: 'ویب سائٹ پر واپس جائیں',
        promoH1: 'تیزی سے ٹریڈ کریں۔ \nبہتر منافع اور \nآسان تجربہ۔',
        promoP: 'ریپڈ مارکیٹ پروسیسنگ سے لے کر گہرائی سے تجزیوں تک، ہمارا طاقتور ٹریڈنگ انجن آپ کو اپنے آلات پر بغیر کسی رکاوٹ کے کام کرنے دیتا ہے۔',
        resetTitle: 'پاس ورڈ دوبارہ ترتیب دیں',
        resetSubtitle: 'اپنا ای میل پتہ درج کریں اور ہم آپ کو او ٹی پی کوڈ بھیجیں گے۔',
        sendBtn: 'او ٹی پی بھیجیں',
        close: 'بند کریں',
        verifyTitle: 'OTP کی تصدیق کریں',
        verifySubtitle: 'اپنے ای میل پر بھیجا گیا 6 ہندسی کوڈ درج کریں۔',
        updateTitle: 'نیا پاس ورڈ',
        updateSubtitle: 'کم از کم 8 حروف والا مضبوط پاس ورڈ بنائیں۔',
        updateBtn: 'پاس ورڈ اپ ڈیٹ کریں',
        newPasswordPlaceholder: 'نیا پاس ورڈ درج کریں',
        confirmPasswordPlaceholder: 'پاس ورڈ کی تصدیق کریں'
    }
};

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [lang, setLang] = useState('english');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password

    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Reset Password State
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState(['', '', '', '', '', '']);
    const [resetToken, setResetToken] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmNewPass, setConfirmNewPass] = useState('');
    const [showNewPass, setShowNewPass] = useState(false);

    // MFA State
    const [showMfaModal, setShowMfaModal] = useState(false);
    const [mfaType, setMfaType] = useState(''); // 'totp' or 'otp'
    const [mfaToken, setMfaToken] = useState('');
    const [mfaOtp, setMfaOtp] = useState(['', '', '', '', '', '']);
    const [mfaLoading, setMfaLoading] = useState(false);
    const [mfaError, setMfaError] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState({ text: '', type: '' });

    const otpInputs = useRef([]);
    const t = translations[lang];

    useEffect(() => {
        if (showForgotModal) {
            setForgotStep(1);
            setResetEmail('');
            setResetOtp(['', '', '', '', '', '']);
            setResetMessage({ text: '', type: '' });
        }
    }, [showForgotModal]);

    const togglePassword = () => setShowPassword(!showPassword);

    const languages = [
        { code: 'english', label: 'English' },
        { code: 'hindi', label: 'हिन्दी' },
        { code: 'vietnam', label: 'Tiếng Việt' },
        { code: 'indonesian', label: 'Bahasa Indonesia' },
        { code: 'arabic', label: 'العربية' },
        { code: 'urdu', label: 'اردو' }
    ];

    const setCookie = (name, value, days) => {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict; Secure";
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const fingerprint = await getDeviceFingerprint();
            const deviceLabel = getDeviceLabel();

            const response = await fetch('https://v3.livefxhub.com:8444/api/live/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    deviceFingerprint: fingerprint,
                    deviceLabel: deviceLabel
                }),
            });

            const result = await response.json();

            if (result.success || result.status === 'success') {
                const data = result.data || result;

                if (data.status === 'totp_required' || data.status === 'otp_required') {
                    setMfaType(data.status === 'totp_required' ? 'totp' : 'otp');
                    setMfaToken(data.loginToken);
                    setShowMfaModal(true);
                    setLoading(false);
                    return;
                }

                const token = data.portalToken;

                if (token) {
                    localStorage.setItem('portalToken', token);
                    localStorage.setItem('deviceFingerprint', fingerprint);
                }

                if (data.portalRefreshToken) {
                    setCookie('portalRefreshToken', data.portalRefreshToken, 7);
                }

                setMessage({ text: 'Login successful! Redirecting...', type: 'success' });
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                setMessage({ text: result.message || 'Login failed', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Something went wrong. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasteReset = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pastedData) return;

        const newOtp = [...resetOtp];
        pastedData.split('').forEach((char, idx) => {
            if (idx < 6) newOtp[idx] = char;
        });
        setResetOtp(newOtp);

        const focusIdx = Math.min(pastedData.length, 5);
        if (otpInputs.current[focusIdx]) otpInputs.current[focusIdx].focus();
    };

    const handlePasteMfa = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pastedData) return;

        const newOtp = [...mfaOtp];
        pastedData.split('').forEach((char, idx) => {
            if (idx < 6) newOtp[idx] = char;
        });
        setMfaOtp(newOtp);

        const focusIdx = Math.min(pastedData.length, 5);
        const next = document.getElementById(`mfa-otp-${focusIdx}`);
        if (next) next.focus();
    };

    const handleForgotPassword = async () => {
        if (!resetEmail) {
            setResetMessage({ text: 'Please enter your email.', type: 'error' });
            return;
        }
        setResetLoading(true);
        setResetMessage({ text: '', type: '' });
        try {
            const res = await fetch('https://v3.livefxhub.com:8444/api/auth/password/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });
            const data = await res.json();
            if (data.success || data.status === 'success') {
                setForgotStep(2);
            } else {
                setResetMessage({ text: data.message || 'Error sending request.', type: 'error' });
            }
        } catch (err) {
            setResetMessage({ text: 'Network error.', type: 'error' });
        } finally {
            setResetLoading(false);
        }
    };

    const handleVerifyResetOtp = async () => {
        const otpString = resetOtp.join('');
        if (otpString.length < 6) return;

        setResetLoading(true);
        setResetMessage({ text: '', type: '' });
        try {
            const res = await fetch('https://v3.livefxhub.com:8444/api/auth/password/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, otp: otpString })
            });
            const data = await res.json();
            if (data.success || data.status === 'success') {
                const token = data.resetToken || (data.data && data.data.resetToken);
                setResetToken(token);
                localStorage.setItem('resetToken', token);
                setForgotStep(3);
            } else {
                setResetMessage({ text: data.message || 'Invalid OTP.', type: 'error' });
            }
        } catch (err) {
            setResetMessage({ text: 'Network error.', type: 'error' });
        } finally {
            setResetLoading(false);
        }
    };

    const validatePassword = (pass) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(pass);
    };

    const handleResetPassword = async () => {
        if (!newPass || !confirmNewPass) return;
        if (newPass !== confirmNewPass) {
            setResetMessage({ text: 'Passwords do not match.', type: 'error' });
            return;
        }
        if (!validatePassword(newPass)) {
            setResetMessage({ text: 'Password must be min 8 chars with 1 Uppercase, 1 Number, and 1 Special Char.', type: 'error' });
            return;
        }

        setResetLoading(true);
        try {
            const res = await fetch('https://v3.livefxhub.com:8444/api/auth/password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetToken, newPassword: newPass })
            });
            const data = await res.json();
            if (data.success || data.status === 'success') {
                setResetMessage({ text: 'Password updated successfully!', type: 'success' });
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setResetMessage({ text: data.message || 'Error resetting password.', type: 'error' });
            }
        } catch (err) {
            setResetMessage({ text: 'Network error.', type: 'error' });
        } finally {
            setResetLoading(false);
        }
    };

    const handleVerifyMfa = async () => {
        const fullOtp = mfaOtp.join('');
        if (fullOtp.length < 6) return;

        setMfaLoading(true);
        setMfaError('');

        const endpoint = mfaType === 'totp'
            ? 'https://v3.livefxhub.com:8444/api/auth/totp/verify'
            : 'https://v3.livefxhub.com:8444/api/auth/otp/verify';

        const payloadKey = mfaType === 'totp' ? 'code' : 'otp';

        try {
            const fingerprint = await getDeviceFingerprint();
            const deviceLabel = getDeviceLabel();

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mfaToken}`
                },
                body: JSON.stringify({
                    [payloadKey]: fullOtp,
                    deviceFingerprint: fingerprint,
                    deviceLabel: deviceLabel
                })
            });

            const result = await res.json();
            if (result.success || result.status === 'success') {
                const data = result.data || result;
                const token = data.portalToken;
                
                if (token) {
                    localStorage.setItem('portalToken', token);
                    localStorage.setItem('deviceFingerprint', fingerprint);
                }

                if (data.portalRefreshToken) {
                    setCookie('portalRefreshToken', data.portalRefreshToken, 7);
                }

                setShowMfaModal(false);
                setMessage({ text: 'Verification successful! Redirecting...', type: 'success' });
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                setMfaError(result.message || 'Verification failed');
            }
        } catch (err) {
            setMfaError('Something went wrong');
        } finally {
            setMfaLoading(false);
        }
    };

    const isRTL = ['arabic', 'urdu'].includes(lang);

    return (
        <div className={`login-page ${isRTL ? 'rtl' : ''}`}>
            {/* Left Side Visual Section */}
            <div
                className="login-left"
                style={{ backgroundImage: `url('/classic_trading_bg.png')` }}
            >
                <div className="login-brand">
                    <span className="brand-name">Live <span className="brand-accent">Fx</span> Hub</span>
                </div>
                <div className="login-promo">
                    <h1 style={{ whiteSpace: 'pre-line' }}>{t.promoH1}</h1>
                    <p>{t.promoP}</p>
                </div>
                <div className="login-footer-dots">
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ width: '20px', height: '4px', background: 'white', borderRadius: '2px' }}></div>
                        <div style={{ width: '4px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }}></div>
                        <div style={{ width: '4px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }}></div>
                    </div>
                </div>
            </div>

            {/* Right Side Login Form */}
            <div className="login-right">
                <div className="login-top-actions">
                    <div className="lang-selector-dummy"></div>
                    <div className="lang-selector-wrapper">
                        <button className="lang-btn" onClick={() => setShowLangMenu(!showLangMenu)}>
                            <Globe size={16} />
                            {languages.find(l => l.code === lang).label}
                            <ChevronDown size={14} className={showLangMenu ? 'rotate' : ''} />
                        </button>
                        {showLangMenu && (
                            <div className="lang-dropdown">
                                {languages.map((l) => (
                                    <div
                                        key={l.code}
                                        className={`lang-option ${lang === l.code ? 'active' : ''}`}
                                        onClick={() => {
                                            setLang(l.code);
                                            setShowLangMenu(false);
                                        }}
                                    >
                                        {l.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="compact-login-container">
                    <h2>{t.welcome}</h2>
                    <p className="login-subtitle">{t.subtitle}</p>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>{t.email}</label>
                            <input
                                type="email"
                                placeholder={t.emailPlaceholder}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>{t.password}</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t.passwordPlaceholder}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <div className="password-toggle" onClick={togglePassword}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </div>
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="remember-me">
                                <input type="checkbox" />
                                {t.remember}
                            </label>
                            <button
                                type="button"
                                className="forgot-password-btn"
                                onClick={() => setShowForgotModal(true)}
                            >
                                {t.forgot}
                            </button>
                        </div>

                        {message.text && (
                            <div className={`login-status-message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`login-submit-btn ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="loader-inner"></div>
                            ) : t.login}
                        </button>

                        <p className="signup-prompt">
                            {t.noAccount} <Link to="/signup">{t.signup}</Link>
                        </p>
                    </form>
                </div>
            </div>

            {/* Forgot Password Modal (Multi-step) */}
            {showForgotModal && (
                <div className="modal-overlay">
                    <div className="reset-modal-content" style={{ position: 'relative' }}>
                        <button className="modal-close-btn" onClick={() => setShowForgotModal(false)}>
                            <X size={18} strokeWidth={3} />
                        </button>
                        <div className="modal-header">
                            <div className="lock-icon-bg">
                                <Lock size={20} color="#3687ED" />
                            </div>
                        </div>

                        <div className="modal-body">
                            {forgotStep === 1 && (
                                <>
                                    <h3>{t.resetTitle}</h3>
                                    <p>{t.resetSubtitle}</p>
                                    <div className="form-group" style={{ textAlign: 'left', marginTop: '20px' }}>
                                        <label>{t.email}</label>
                                        <input
                                            type="email"
                                            placeholder={t.emailPlaceholder}
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                        />
                                    </div>
                                    {resetMessage.text && (
                                        <div className={`login-status-message ${resetMessage.type} compact`}>
                                            {resetMessage.text}
                                        </div>
                                    )}
                                    <button
                                        className={`login-submit-btn ${resetLoading ? 'loading' : ''}`}
                                        onClick={handleForgotPassword}
                                        disabled={resetLoading}
                                    >
                                        {resetLoading ? <div className="loader-inner"></div> : t.sendBtn}
                                    </button>
                                </>
                            )}

                            {forgotStep === 2 && (
                                <>
                                    <h3>{t.verifyTitle}</h3>
                                    <p>{t.verifySubtitle}</p>
                                    <div className="otp-input-container">
                                        {resetOtp.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                type="text"
                                                maxLength="1"
                                                value={digit}
                                                ref={el => otpInputs.current[idx] = el}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    const newOtp = [...resetOtp];
                                                    newOtp[idx] = val;
                                                    setResetOtp(newOtp);
                                                    if (val && idx < 5) otpInputs.current[idx + 1].focus();
                                                }}
                                                onPaste={handlePasteReset}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Backspace' && !resetOtp[idx] && idx > 0) otpInputs.current[idx - 1].focus();
                                                }}
                                            />
                                        ))}
                                    </div>
                                    {resetMessage.text && (
                                        <div className={`login-status-message ${resetMessage.type} compact`}>
                                            {resetMessage.text}
                                        </div>
                                    )}
                                    <button
                                        className={`login-submit-btn ${resetLoading ? 'loading' : ''}`}
                                        onClick={handleVerifyResetOtp}
                                        disabled={resetLoading}
                                    >
                                        {resetLoading ? <div className="loader-inner"></div> : "Verify OTP"}
                                    </button>
                                </>
                            )}

                            {forgotStep === 3 && (
                                <>
                                    <h3>{t.updateTitle}</h3>
                                    <p>{t.updateSubtitle}</p>
                                    <div className="form-group" style={{ textAlign: 'left', marginTop: '20px' }}>
                                        <label>New Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showNewPass ? "text" : "password"}
                                                placeholder={t.newPasswordPlaceholder}
                                                value={newPass}
                                                onChange={(e) => setNewPass(e.target.value)}
                                            />
                                            <div className="password-toggle" onClick={() => setShowNewPass(!showNewPass)}>
                                                {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ textAlign: 'left' }}>
                                        <label>Confirm Password</label>
                                        <input
                                            type={showNewPass ? "text" : "password"}
                                            placeholder={t.confirmPasswordPlaceholder}
                                            value={confirmNewPass}
                                            onChange={(e) => setConfirmNewPass(e.target.value)}
                                        />
                                    </div>
                                    {resetMessage.text && (
                                        <div className={`login-status-message ${resetMessage.type} compact`}>
                                            {resetMessage.text}
                                        </div>
                                    )}
                                    <button
                                        className={`login-submit-btn ${resetLoading ? 'loading' : ''}`}
                                        onClick={handleResetPassword}
                                        disabled={resetLoading}
                                    >
                                        {resetLoading ? <div className="loader-inner"></div> : t.updateBtn}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Two-Factor Authentication / Email OTP Modal */}
            {showMfaModal && (
                <div className="modal-overlay">
                    <div className="reset-modal-content mfa-modal">
                        <div className="modal-header mfa-header">
                            <div className="auth-alert-icon-bg">
                                <ShieldAlert size={22} color="#EF4444" />
                            </div>
                            <button className="modal-close-btn" onClick={() => setShowMfaModal(false)}>
                                <X size={18} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <h3>Unauthorized Login</h3>
                            <p>
                                {mfaType === 'totp'
                                    ? 'An unauthorized login attempt was detected. Please enter your authenticator code to proceed.'
                                    : 'A verification code has been sent to your registered email to authorized this login attempt.'}
                            </p>

                            <div className="otp-input-container">
                                {mfaOtp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            const newOtp = [...mfaOtp];
                                            newOtp[idx] = val;
                                            setMfaOtp(newOtp);
                                            if (val && idx < 5) {
                                                const next = document.getElementById(`mfa-otp-${idx + 1}`);
                                                if (next) next.focus();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !mfaOtp[idx] && idx > 0) {
                                                const prev = document.getElementById(`mfa-otp-${idx - 1}`);
                                                if (prev) prev.focus();
                                            }
                                        }}
                                        onPaste={handlePasteMfa}
                                        id={`mfa-otp-${idx}`}
                                    />
                                ))}
                            </div>

                            {mfaError && (
                                <div className="login-status-message error compact">
                                    {mfaError}
                                </div>
                            )}

                            <button
                                className={`login-submit-btn ${mfaLoading ? 'loading' : ''}`}
                                onClick={handleVerifyMfa}
                                disabled={mfaLoading || mfaOtp.join('').length < 6}
                            >
                                {mfaLoading ? <div className="loader-inner"></div> : "Verify Login"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
