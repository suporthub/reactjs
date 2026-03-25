import React, { useState } from 'react';
import { Eye, EyeOff, Globe, ChevronDown, X, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import './login.css';

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
        resetSubtitle: 'Enter your email address and we will send you instructions to reset your password.',
        sendBtn: 'Send Instructions',
        close: 'Close'
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
        promoP: 'रैपिड मार्केट निष्पादन से लेकर गहन संस्थागत विश्लेषण तक, हमारा शक्तिशाली ट्रेडिंग इंजन आपको अपने सभी उपकरणों पर निर्बाض रूप से काम करने देता है।',
        resetTitle: 'पासवर्ड रीसेट करें',
        resetSubtitle: 'अपना ईमेल पता दर्ज करें और हम आपको पासवर्ड रीसेट करने के निर्देश भेजेंगे।',
        sendBtn: 'निर्देश भेजें',
        close: 'बंद करें'
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
        resetSubtitle: 'Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn hướng dẫn để đặt lại mật khẩu.',
        sendBtn: 'Gửi hướng dẫn',
        close: 'Đóng'
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
        resetSubtitle: 'Masukkan alamat email Anda dan kami akan mengirimkan instruksi untuk mengatur ulang kata sandi Anda.',
        sendBtn: 'Kirim Instruksi',
        close: 'Tutup'
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
        resetSubtitle: 'أدخل عنوان بريدك الإلكتروني وسنرسل لك تعليمات لإعادة تعيين كلمة مرورك.',
        sendBtn: 'إرسال التعليمات',
        close: 'إغلاق'
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
        promoP: 'ریپڈ مارکیٹ پروسیسنگ سے لے کر گہرائی سے تجزیوں تک، ہمارا طاقتور ٹریڈنگ انجن آپ کو اپنے تمام آلات پر بغیر کسی رکاوٹ کے کام کرنے دیتا ہے۔',
        resetTitle: 'پاس ورڈ دوبارہ ترتیب دیں',
        resetSubtitle: 'اپنا ای میل پتہ درج کریں اور ہم آپ کو پاس ورڈ دوبارہ ترتیب دینے کی ہدایات بھیجیں گے۔',
        sendBtn: 'ہدایات بھیجیں',
        close: 'بند کریں'
    }
};

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [lang, setLang] = useState('english');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const t = translations[lang];
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
            const response = await fetch('https://v3.livefxhub.com:8444/api/live/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (result.success) {
                // Success Case
                localStorage.setItem('accessToken', result.data.accessToken);
                setCookie('refreshToken', result.data.refreshToken, 7); // Store for 7 days or as needed
                setMessage({ text: result.data.status || 'Login successful', type: 'success' });
                
                // Optional: Redirect after success
                // setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                // Failure Case
                setMessage({ text: result.message || 'Login failed', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Something went wrong. Please try again.', type: 'error' });
            console.error('Login error:', error);
        } finally {
            setLoading(false);
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

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="modal-overlay">
                    <div className="reset-modal-content">
                        <div className="modal-header">
                            <div className="lock-icon-bg">
                                <Lock size={20} color="#3687ED" />
                            </div>
                            <button className="close-modal" onClick={() => setShowForgotModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <h3>{t.resetTitle}</h3>
                            <p>{t.resetSubtitle}</p>
                            
                            <div className="form-group" style={{ textAlign: 'left', marginTop: '20px' }}>
                                <label>{t.email}</label>
                                <input type="email" placeholder={t.emailPlaceholder} />
                            </div>
                            
                            <button className="login-submit-btn" style={{ marginTop: '10px' }}>
                                {t.sendBtn}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
