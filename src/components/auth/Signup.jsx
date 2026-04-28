import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Globe, ChevronDown, Check, X, ArrowRight } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import countriesLib, { getCountriesForLanguage } from '../../utils/countries';
import './login.css';
import { getDeviceFingerprint } from '../../utils/fingerprint';

const countryCodes = [
    { code: "+1", label: "🇺🇸 USA (+1)", name: "United States" },
    { code: "+44", label: "🇬🇧 UK (+44)", name: "United Kingdom" },
    { code: "+91", label: "🇮🇳 India (+91)", name: "India" },
    { code: "+61", label: "🇦🇺 Australia (+61)", name: "Australia" },
    { code: "+81", label: "🇯🇵 Japan (+81)", name: "Japan" },
    { code: "+49", label: "🇩🇪 Germany (+49)", name: "Germany" },
    { code: "+86", label: "🇨🇳 China (+86)", name: "China" },
    { code: "+33", label: "🇫🇷 France (+33)", name: "France" },
    { code: "+39", label: "🇮🇹 Italy (+39)", name: "Italy" },
    { code: "+7", label: "🇷🇺 Russia (+7)", name: "Russia" },
    { code: "+34", label: "🇪🇸 Spain (+34)", name: "Spain" },
    { code: "+46", label: "🇸🇪 Sweden (+46)", name: "Sweden" },
    { code: "+41", label: "🇨🇭 Switzerland (+41)", name: "Switzerland" },
    { code: "+31", label: "🇳🇱 Netherlands (+31)", name: "Netherlands" },
    { code: "+55", label: "🇧🇷 Brazil (+55)", name: "Brazil" },
    { code: "+27", label: "🇿🇦 South Africa (+27)", name: "South Africa" },
    { code: "+84", label: "🇻🇳 Vietnam (+84)", name: "Vietnam" },
    { code: "+62", label: "🇮🇩 Indonesia (+62)", name: "Indonesia" },
    { code: "+971", label: "🇦🇪 UAE (+971)", name: "United Arab Emirates" },
    { code: "+92", label: "🇵🇰 Pakistan (+92)", name: "Pakistan" },
    { code: "+60", label: "🇲🇾 Malaysia (+60)", name: "Malaysia" },
    { code: "+63", label: "🇵🇭 Philippines (+63)", name: "Philippines" },
    { code: "+66", label: "🇹🇭 Thailand (+66)", name: "Thailand" },
    { code: "+65", label: "🇸🇬 Singapore (+65)", name: "Singapore" },
    { code: "+90", label: "🇹🇷 Turkey (+90)", name: "Turkey" },
    { code: "+82", label: "🇰🇷 South Korea (+82)", name: "South Korea" },
    { code: "+1", label: "🇨🇦 Canada (+1)", name: "Canada" },
    { code: "+52", label: "🇲🇽 Mexico (+52)", name: "Mexico" },
    { code: "+20", label: "🇪🇬 Egypt (+20)", name: "Egypt" },
    { code: "+234", label: "🇳🇬 Nigeria (+234)", name: "Nigeria" },
    { code: "+966", label: "🇸🇦 Saudi Arabia (+966)", name: "Saudi Arabia" },
    { code: "+254", label: "🇰🇪 Kenya (+254)", name: "Kenya" },
    { code: "+27", label: "🇿🇦 South Africa (+27)", name: "South Africa" },
    { code: "+54", label: "🇦🇷 Argentina (+54)", name: "Argentina" },
    { code: "+56", label: "🇨🇱 Chile (+56)", name: "Chile" },
    { code: "+64", label: "🇳🇿 New Zealand (+64)", name: "New Zealand" },
    { code: "+47", label: "🇳🇴 Norway (+47)", name: "Norway" },
    { code: "+45", label: "🇩🇰 Denmark (+45)", name: "Denmark" },
    { code: "+358", label: "🇫🇮 Finland (+358)", name: "Finland" },
    { code: "+351", label: "🇵🇹 Portugal (+351)", name: "Portugal" },
    { code: "+30", label: "🇬🇷 Greece (+30)", name: "Greece" },
    { code: "+353", label: "🇮🇪 Ireland (+353)", name: "Ireland" },
    { code: "+48", label: "🇵🇱 Poland (+48)", name: "Poland" },
    { code: "+420", label: "🇨🇿 Czech Rep. (+420)", name: "Czech Republic" },
    { code: "+36", label: "🇭🇺 Hungary (+36)", name: "Hungary" },
    { code: "+40", label: "🇷🇴 Romania (+40)", name: "Romania" },
    { code: "+372", label: "🇪🇪 Estonia (+372)", name: "Estonia" },
    { code: "+371", label: "🇱🇻 Latvia (+371)", name: "Latvia" },
    { code: "+370", label: "🇱🇹 Lithuania (+370)", name: "Lithuania" },
    { code: "+352", label: "🇱🇺 Luxembourg (+352)", name: "Luxembourg" },
    { code: "+356", label: "🇲🇹 Malta (+356)", name: "Malta" },
    { code: "+359", label: "🇧🇬 Bulgaria (+359)", name: "Bulgaria" },
    { code: "+385", label: "🇭🇷 Croatia (+385)", name: "Croatia" },
    { code: "+381", label: "🇷🇸 Serbia (+381)", name: "Serbia" },
    { code: "+380", label: "🇺🇦 Ukraine (+380)", name: "Ukraine" },
    { code: "+7", label: "🇰🇿 Kazakhstan (+7)", name: "Kazakhstan" },
    { code: "+972", label: "🇮🇱 Israel (+972)", name: "Israel" },
    { code: "+961", label: "🇱🇧 Lebanon (+961)", name: "Lebanon" },
    { code: "+962", label: "🇯🇴 Jordan (+962)", name: "Jordan" },
    { code: "+964", label: "🇮🇶 Iraq (+964)", name: "Iraq" },
    { code: "+963", label: "🇸🇾 Syria (+963)", name: "Syria" },
    { code: "+967", label: "🇾🇪 Yemen (+967)", name: "Yemen" },
    { code: "+968", label: "🇴🇲 Oman (+968)", name: "Oman" },
    { code: "+974", label: "🇶🇦 Qatar (+974)", name: "Qatar" },
    { code: "+973", label: "🇧🇭 Bahrain (+973)", name: "Bahrain" },
    { code: "+94", label: "🇱🇰 Sri Lanka (+94)", name: "Sri Lanka" },
    { code: "+880", label: "🇧🇩 Bangladesh (+880)", name: "Bangladesh" },
    { code: "+977", label: "🇳🇵 Nepal (+977)", name: "Nepal" }
];



const translations = {
    english: {
        welcome: 'Create Account',
        subtitle: 'Sign up to start your trading journey.',
        email: 'Email',
        emailPlaceholder: 'Input your email',
        mobile: 'Mobile Number',
        mobilePlaceholder: 'Enter mobile number',
        country: 'Country',
        countryPlaceholder: 'Select country',
        password: 'Password',
        passwordPlaceholder: 'Create a password',
        confirmPassword: 'Confirm Password',
        confirmPlaceholder: 'Re-enter your password',
        accountType: 'Account Category',
        selectAccount: 'Select Account',
        signup: 'Sign Up',
        hasAccount: 'Already have an account?',
        login: 'Login here',
        promoH1: 'Trade Smarter. \nExecute Faster. \nProfit Anywhere.',
        promoP: 'From rapid market execution to deep institutional analytics, our powerful trading engine lets you work seamlessly across all your devices.',
        live: 'Live',
        demo: 'Demo',
        standard: 'Standard',
        classic: 'Classic',
        royalPlus: 'Royal+',
        ecn: 'ECN',
        vip: 'VIP',
        elite: 'Elite',
        referralId: 'Referral ID',
        referralPlaceholder: 'Enter referral ID (optional)'
    },
    hindi: {
        welcome: 'खाता बनाएं',
        subtitle: 'अपनी ट्रेडिंग यात्रा शुरू करने के लिए साइन अप करें।',
        email: 'ईमेल',
        emailPlaceholder: 'अपना ईमेल डालें',
        mobile: 'मोबाइल नंबर',
        mobilePlaceholder: 'मोबाइल नंबर डालें',
        country: 'देश',
        countryPlaceholder: 'देश चुनें',
        password: 'पासवर्ड',
        passwordPlaceholder: 'पासवर्ड बनाएं',
        confirmPassword: 'पासवर्ड की पुष्टि करें',
        confirmPlaceholder: 'दोबारा पासवर्ड डालें',
        accountType: 'खाते की श्रेणी',
        selectAccount: 'खाता चुनें',
        signup: 'साइन अप करें',
        hasAccount: 'क्या आपके पास पहले से खाता है?',
        login: 'यहाँ लॉग इन करें',
        promoH1: 'तेजी से ट्रेड करें। \nबेहतर लाभ और \nसुविधाजनक अनुभव।',
        promoP: 'रैपिड मार्केट निष्पादन से लेकर गहन संस्थागत विश्लेषण तक, हमारा शक्तिशाली ट्रेडिंग इंजन आपको निर्बाध रूप से काम करने देता है।',
        live: 'लाइव',
        demo: 'डेमो',
        standard: 'Standard',
        classic: 'Classic',
        royalPlus: 'Royal+',
        ecn: 'ECN',
        vip: 'VIP',
        elite: 'Elite',
        referralId: 'रेफरल आईडी',
        referralPlaceholder: 'रेफरल आईडी दर्ज करें (वैकल्पिक)'
    },
    vietnam: {
        welcome: 'Tạo tài khoản',
        subtitle: 'Đăng ký để bắt đầu hành trình giao dịch của bạn.',
        email: 'Email',
        emailPlaceholder: 'Nhập email của bạn',
        mobile: 'Số điện thoại',
        mobilePlaceholder: 'Nhập số điện thoại',
        country: 'Quốc gia',
        countryPlaceholder: 'Chọn quốc gia',
        password: 'Mật khẩu',
        passwordPlaceholder: 'Tạo mật khẩu',
        confirmPassword: 'Xác nhận mật khẩu',
        confirmPlaceholder: 'Nhập lại mật khẩu',
        accountType: 'Phân loại tài khoản',
        selectAccount: 'Chọn loại tài khoản',
        signup: 'Đăng ký',
        hasAccount: 'Đã có tài khoản?',
        login: 'Đăng nhập tại đây',
        promoH1: 'Giao dịch Thông minh. \nThực thi Nhanh hơn. \nLợi nhuận Mọi nơi.',
        promoP: 'Từ việc khớp lệnh thị trường nhanh chóng đến các phân tích chuyên sâu, công cụ giao dịch mạnh mẽ của chúng tôi giúp bạn làm việc mượt mà.',
        live: 'Thực',
        demo: 'Demo',
        standard: 'Standard',
        classic: 'Classic',
        royalPlus: 'Royal+',
        ecn: 'ECN',
        vip: 'VIP',
        elite: 'Elite',
        referralId: 'ID người giới thiệu',
        referralPlaceholder: 'Nhập ID người giới thiệu (tùy chọn)'
    },
    indonesian: {
        welcome: 'Buat Akun',
        subtitle: 'Daftar untuk memulai perjalanan trading Anda.',
        email: 'Email',
        emailPlaceholder: 'Masukkan email Anda',
        mobile: 'Nomor Telepon',
        mobilePlaceholder: 'Masukkan nomor telepon',
        country: 'Negara',
        countryPlaceholder: 'Pilih negara',
        password: 'Kata Sandi',
        passwordPlaceholder: 'Buat kata sandi',
        confirmPassword: 'Konfirmasi Kata Sandi',
        confirmPlaceholder: 'Masukkan kembali kata sandi',
        accountType: 'Kategori Akun',
        selectAccount: 'Pilih Akun',
        signup: 'Daftar',
        hasAccount: 'Sudah punya akun?',
        login: 'Login di sini',
        promoH1: 'Trading Lebih Pintar. \nEksekusi Lebih Cepat. \nProfit di Mana Saja.',
        promoP: 'Dari eksekusi pasar yang cepat hingga analitik institusional yang mendalam, mesin trading kami memungkinkan Anda bekerja tanpa hambatan.',
        live: 'Live',
        demo: 'Demo',
        standard: 'Standard',
        classic: 'Classic',
        royalPlus: 'Royal+',
        ecn: 'ECN',
        vip: 'VIP',
        elite: 'Elite',
        referralId: 'ID Referal',
        referralPlaceholder: 'Masukkan ID referal (opsional)'
    },
    arabic: {
        welcome: 'إنشاء حساب',
        subtitle: 'سجل الآن لبدء رحلة التداول الخاصة بك.',
        email: 'البريد الإلكتروني',
        emailPlaceholder: 'أدخل بريدك الإلكتروني',
        mobile: 'رقم الهاتف',
        mobilePlaceholder: 'أدخل رقم الهاتف',
        country: 'الدولة',
        countryPlaceholder: 'اختر الدولة',
        password: 'كلمة المرور',
        passwordPlaceholder: 'أنشئ كلمة مرور',
        confirmPassword: 'تأكيد كلمة المرور',
        confirmPlaceholder: 'أعد إدخال كلمة المرور',
        accountType: 'نوع الحساب',
        selectAccount: 'اختر نوع الحساب',
        signup: 'تسجيل',
        hasAccount: 'لديك حساب بالفعل؟',
        login: 'سجل دخول هنا',
        promoH1: 'تداول بذكاء. \nنفذ أسرع. \nاربح في كل مكان.',
        promoP: 'من تنفيذ السوق بسرعة إلى التحليلات المؤسسية العميقة، يتيح لك محرك التداول المطور لدينا العمل بسلاسة.',
        live: 'حقيقي',
        demo: 'تجريبي',
        standard: 'Standard',
        classic: 'Classic',
        royalPlus: 'Royal+',
        ecn: 'ECN',
        vip: 'VIP',
        elite: 'Elite',
        referralId: 'معرف الإحالة',
        referralPlaceholder: 'أدخل معرف الإحالة (اختياري)'
    },
    urdu: {
        welcome: 'اکاؤنٹ بنائیں',
        subtitle: 'اپنا ٹریڈنگ کا سفر شروع کرنے کے لیے سائن اپ کریں۔',
        email: 'ای ای میل',
        emailPlaceholder: 'اپنا ای میل درج کریں',
        mobile: 'موبائل نمبر',
        mobilePlaceholder: 'اپنا موبائل نمبر درج کریں',
        country: 'ملک',
        countryPlaceholder: 'ملک منتخب کریں',
        password: 'پاس ورڈ',
        passwordPlaceholder: 'پاس ورڈ بنائیں',
        confirmPassword: 'پاس ورڈ کی تصدیق کریں',
        confirmPlaceholder: 'دوبارہ پاس ورڈ درج کریں',
        accountType: 'اکاؤنٹ کا زمرہ',
        selectAccount: 'اکاؤنٹ منتخب کریں',
        signup: 'سائن اپ کریں',
        hasAccount: 'پہلے سے اکاؤنٹ ہے؟',
        login: 'یہاں لاگ ان کریں',
        promoH1: 'تیزی سے ٹریڈ کریں۔ \nبہتر منافع اور \nآسان تجربہ।',
        promoP: 'ریپڈ مارکیٹ परोसिसिंग से लेकर गहराई से विश्लेषणों तक, हमारा शक्तिशाली ट्रेडिंग इंजन आपको बगैर किसी रुकावट के काम करने देता है।',
        live: 'لائیو',
        demo: 'ڈیمو',
        standard: 'Standard',
        classic: 'Classic',
        royalPlus: 'Royal+',
        ecn: 'ECN',
        vip: 'VIP',
        elite: 'Elite',
        referralId: 'ریفرل آئی ڈی',
        referralPlaceholder: 'ریفرل آئی ڈی درج کریں (اختیاری)'
    }
};

export default function Signup() {
    const navigate = useNavigate();
    const { referralCode } = useParams();
    const [showPassword, setShowPassword] = useState(false);
    const [lang, setLang] = useState('english');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [accountKind, setAccountKind] = useState('live'); // 'live' or 'demo'

    // Separate State for Live and Demo
    const [liveData, setLiveData] = useState({
        email: '',
        phoneCode: '+1',
        mobile: '',
        country: '',
        countryISO2: '',
        password: '',
        confirmPassword: '',
        referralId: '',
        accountType: '' // Initial state empty
    });

    const [demoData, setDemoData] = useState({
        email: '',
        phoneCode: '+1',
        mobile: '',
        country: '',
        countryISO2: '',
        password: '',
        confirmPassword: '',
        referralId: '',
        accountType: 'demo'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (referralCode) {
            setLiveData(prev => ({ ...prev, referralId: referralCode }));
            setDemoData(prev => ({ ...prev, referralId: referralCode }));
        }
    }, [referralCode]);

    // OTP Related States
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [submittingOtp, setSubmittingOtp] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otpSuccess, setOtpSuccess] = useState('');
    const [accountInfo, setAccountInfo] = useState({ accountNumber: '', message: '' });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpInputs = useRef([]);

    const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
    const [phoneSearch, setPhoneSearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');

    const dynamicCountries = getCountriesForLanguage(lang);
    const phoneDropdownRef = useRef(null);
    const countryDropdownRef = useRef(null);

    // Get Active Data based on accountKind
    const formData = accountKind === 'live' ? liveData : demoData;
    const setFormData = accountKind === 'live' ? setLiveData : setDemoData;

    useEffect(() => {
        function handleClickOutside(event) {
            if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(event.target)) {
                setShowPhoneDropdown(false);
            }
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
                setShowCountryDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const togglePhoneDropdown = () => {
        setShowPhoneDropdown(!showPhoneDropdown);
        setShowCountryDropdown(false);
    };

    const toggleCountryDropdown = () => {
        setShowCountryDropdown(!showCountryDropdown);
        setShowPhoneDropdown(false);
    };

    const t = translations[lang];
    const isRTL = ['arabic', 'urdu'].includes(lang);

    const languages = [
        { code: 'english', label: 'English' },
        { code: 'hindi', label: 'हिन्दी' },
        { code: 'vietnam', label: 'Tiếng Việt' },
        { code: 'indonesian', label: 'Bahasa Indonesia' },
        { code: 'arabic', label: 'العربية' },
        { code: 'urdu', label: 'اردو' }
    ];

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.accountType) {
            setError("Please select an account type");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const endpoint = accountKind === 'live' ? 'https://v3.livefxhub.com:8444/api/live/register' : 'https://v3.livefxhub.com:8444/api/demo/register';
            const payload = {
                email: formData.email,
                phoneNumber: `${formData.phoneCode}${formData.mobile}`,
                password: formData.password,
                country: formData.countryISO2,
                groupName: formData.accountType.charAt(0).toUpperCase() + formData.accountType.slice(1),
                currency: "USD",
                leverage: 100,
                referralCode: formData.referralId || ""
            };

            const fingerprint = await getDeviceFingerprint();
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Device-Fingerprint': fingerprint
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.status === 'success' || data.success) {
                if (accountKind === 'demo') {
                    // Redirect to login after demo signup
                    navigate('/login');
                } else {
                    setAccountInfo({
                        accountNumber: data.accountNumber,
                        email: formData.email,
                        message: data.message,
                        isConflict: false
                    });
                    setShowOtpModal(true);
                }
            } else if (data.code === 'EMAIL_PENDING_VERIFICATION') {
                // User already registered but not verified
                setAccountInfo({
                    accountNumber: data.accountNumber || data.data?.accountNumber || '',
                    email: formData.email,
                    message: data.message,
                    isConflict: true
                });
                setShowOtpModal(true);
            } else {
                setError(data.message || "Registration failed");
            }
        } catch (error) {
            console.error("Registration error:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const [resendCooldown, setResendCooldown] = useState(0);

    // Timer effect for resend cooldown
    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pastedData) return;

        const newOtp = [...otp];
        pastedData.split('').forEach((char, idx) => {
            if (idx < 6) newOtp[idx] = char;
        });
        setOtp(newOtp);

        const focusIdx = Math.min(pastedData.length, 5);
        if (otpInputs.current[focusIdx]) otpInputs.current[focusIdx].focus();
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;

        setSubmittingOtp(true);
        setOtpError('');
        setOtpSuccess('');
        try {
            const fingerprint = await getDeviceFingerprint();
            const response = await fetch('https://v3.livefxhub.com:8444/api/auth/otp/send', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Device-Fingerprint': fingerprint
                },
                body: JSON.stringify({
                    email: accountInfo.email,
                    purpose: "email_verify"
                })
            });
            const data = await response.json();
            if (data.success || data.status === 'success') {
                setOtpSuccess("Verification code resent successfully!");
                setResendCooldown(120); // Start 2 minute timer
            } else {
                setOtpError(data.message || "Failed to resend OTP.");
            }
        } catch (err) {
            setOtpError("Network error. Please try again.");
        } finally {
            setSubmittingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join('');
        if (otpString.length < 6) {
            setOtpError("Please enter the full 6-digit code.");
            return;
        }

        setSubmittingOtp(true);
        setOtpError('');
        setOtpSuccess('');

        try {
            // Always use email as the identifier for verification
            const payload = {
                email: accountInfo.email,
                otp: otpString
            };

            const fingerprint = await getDeviceFingerprint();
            const response = await fetch('https://v3.livefxhub.com:8444/api/auth/verify-email', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Device-Fingerprint': fingerprint
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.status === 'success' || data.success) {
                setOtpSuccess(data.message || "Email verified successfully!");
                setTimeout(() => {
                    navigate('/login'); // Redirect to login after verification
                }, 1500);
            } else {
                setOtpError(data.message || "Invalid OTP. Please try again.");
            }
        } catch (err) {
            console.error("OTP Verification error:", err);
            setOtpError("Verification failed. Please try again.");
        } finally {
            setSubmittingOtp(false);
        }
    };

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

            {/* Right Side Signup Form */}
            <div className="login-right scrollable-form">
                <div className="login-top-actions">
                    <div className="account-kind-toggle">
                        <button
                            className={`toggle-btn ${accountKind === 'live' ? 'active live' : ''}`}
                            onClick={() => {
                                setAccountKind('live');
                                setError('');
                            }}
                        >
                            {t.live}
                        </button>
                        <button
                            className={`toggle-btn ${accountKind === 'demo' ? 'active demo' : ''}`}
                            onClick={() => {
                                setAccountKind('demo');
                                setError('');
                            }}
                        >
                            {t.demo}
                        </button>
                    </div>

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

                <div className="compact-login-container signup-view">

                    <h2>{t.welcome}</h2>
                    <p className="login-subtitle">{t.subtitle}</p>

                    {referralCode && (
                        <div className="referral-applied-badge">
                            <Check size={14} />
                            <span>{t.referralId} {referralCode} Applied</span>
                        </div>
                    )}

                    <form onSubmit={handleSignup}>
                        <div className="form-group">
                            <label>{t.email}</label>
                            <input
                                type="email"
                                placeholder={t.emailPlaceholder}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>{t.mobile}</label>
                            <div className="phone-input-row">
                                <div className="custom-searchable-dropdown" ref={phoneDropdownRef}>
                                    <div
                                        className={`dropdown-selected phone-code-trigger ${showPhoneDropdown ? 'active' : ''}`}
                                        onClick={togglePhoneDropdown}
                                    >
                                        <span>{countryCodes.find(c => c.code === formData.phoneCode)?.label.split(' ')[0]} {formData.phoneCode}</span>
                                        <ChevronDown size={14} className={showPhoneDropdown ? 'rotate' : ''} />
                                    </div>

                                    {showPhoneDropdown && (
                                        <div className="dropdown-menu phone-code-menu">
                                            <div className="dropdown-search-wrapper">
                                                <input
                                                    type="text"
                                                    placeholder="Search code..."
                                                    value={phoneSearch}
                                                    onChange={(e) => setPhoneSearch(e.target.value)}
                                                    autoFocus
                                                />
                                                {phoneSearch && <X size={14} className="clear-search" onClick={() => setPhoneSearch('')} />}
                                            </div>
                                            <div className="dropdown-options">
                                                {countryCodes
                                                    .filter(c =>
                                                        c.label.toLowerCase().includes(phoneSearch.toLowerCase()) ||
                                                        c.code.includes(phoneSearch) ||
                                                        c.name?.toLowerCase().includes(phoneSearch.toLowerCase())
                                                    )
                                                    .map(c => (
                                                        <div
                                                            key={`${c.code}-${c.name}`}
                                                            className={`dropdown-option ${formData.phoneCode === c.code ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setFormData({ ...formData, phoneCode: c.code });
                                                                setShowPhoneDropdown(false);
                                                                setPhoneSearch('');
                                                            }}
                                                        >
                                                            <span>{c.label}</span>
                                                            {formData.phoneCode === c.code && <Check size={14} className="check-icon" />}
                                                        </div>
                                                    ))
                                                }
                                                {countryCodes.filter(c =>
                                                    c.label.toLowerCase().includes(phoneSearch.toLowerCase()) ||
                                                    c.code.includes(phoneSearch) ||
                                                    c.name?.toLowerCase().includes(phoneSearch.toLowerCase())
                                                ).length === 0 && (
                                                        <div className="no-results">No countries found</div>
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="tel"
                                    className="phone-number-field"
                                    placeholder={t.mobilePlaceholder}
                                    value={formData.mobile}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setFormData({ ...formData, mobile: value });
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t.password}</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t.passwordPlaceholder}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t.confirmPassword}</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t.confirmPlaceholder}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>

                        {accountKind === 'live' && (
                            <div className="form-group">
                                <label>{t.referralId}</label>
                                <input
                                    type="text"
                                    placeholder={t.referralPlaceholder}
                                    value={formData.referralId}
                                    onChange={(e) => !referralCode && setFormData({ ...formData, referralId: e.target.value })}
                                    readOnly={!!referralCode}
                                    className={referralCode ? 'readonly-input' : ''}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>{t.accountType}</label>
                            {accountKind === 'live' ? (
                                <select
                                    value={formData.accountType}
                                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>{t.selectAccount}</option>
                                    <option value="standard">{t.standard}</option>
                                    <option value="classic">{t.classic}</option>
                                    <option value="royalPlus">{t.royalPlus}</option>
                                    <option value="ecn">{t.ecn}</option>
                                    <option value="vip">{t.vip}</option>
                                    <option value="elite">{t.elite}</option>
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={t.demo}
                                    readOnly
                                    className="readonly-input"
                                />
                            )}
                        </div>

                        <div className="form-group">
                            <label>{t.country}</label>
                            <div className="custom-searchable-dropdown full-width" ref={countryDropdownRef}>
                                <div
                                    className={`dropdown-selected country-trigger ${showCountryDropdown ? 'active' : ''}`}
                                    onClick={toggleCountryDropdown}
                                >
                                    <span style={{ color: !formData.country ? '#94a3b8' : 'inherit' }}>
                                        {formData.country || t.countryPlaceholder}
                                    </span>
                                    <ChevronDown size={14} className={showCountryDropdown ? 'rotate' : ''} />
                                </div>

                                {showCountryDropdown && (
                                    <div className="dropdown-menu">
                                        <div className="dropdown-search-wrapper">
                                            <input
                                                type="text"
                                                placeholder="Search country..."
                                                value={countrySearch}
                                                onChange={(e) => setCountrySearch(e.target.value)}
                                                autoFocus
                                            />
                                            {countrySearch && <X size={14} className="clear-search" onClick={() => setCountrySearch('')} />}
                                        </div>
                                        <div className="dropdown-options">
                                            {dynamicCountries
                                                .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                                                .map(country => (
                                                    <div
                                                        key={country.code}
                                                        className={`dropdown-option ${formData.country === country.name ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                country: country.name,
                                                                countryISO2: country.code
                                                            });
                                                            setShowCountryDropdown(false);
                                                            setCountrySearch('');
                                                        }}
                                                    >
                                                        <span>{country.name}</span>
                                                        {formData.country === country.name && <Check size={14} className="check-icon" />}
                                                    </div>
                                                ))
                                            }
                                            {dynamicCountries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
                                                <div className="no-results">No results found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="login-status-message error">
                                <X size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`login-submit-btn ${loading ? 'loading' : ''}`}
                            style={{ marginTop: '10px' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="loader-inner"></div>
                            ) : (
                                <>
                                    <span>{t.signup}</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <p className="signup-prompt">
                            {t.hasAccount} <Link to="/login">{t.login}</Link>
                        </p>
                    </form>
                </div>
            </div>

            {/* OTP Modal */}
            {showOtpModal && (
                <div className="otp-modal-overlay">
                    <div className={`otp-modal-content ${accountInfo.isConflict ? 'compact-conflict' : ''}`}>
                        <button className="modal-close-btn" onClick={() => setShowOtpModal(false)}>
                            <X size={18} strokeWidth={3} />
                        </button>

                        <div className="otp-header">
                            <div className="success-icon-wrapper">
                                <Check size={32} />
                            </div>
                            <h3>Verify Your Email</h3>
                            <p className="otp-msg">{accountInfo.message}</p>
                            <div className="acc-badge">
                                <div className="email-badge-label">
                                    <span>Email: </span>
                                    <strong style={{ fontSize: '12px' }}>{accountInfo.email}</strong>
                                </div>
                            </div>
                        </div>

                        {otpError && (
                            <div className="login-status-message error compact">
                                <span>{otpError}</span>
                            </div>
                        )}
                        {otpSuccess && (
                            <div className="login-status-message success compact">
                                <span>{otpSuccess}</span>
                            </div>
                        )}

                        <div className="otp-input-container">
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    ref={el => otpInputs.current[idx] = el}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        const newOtp = [...otp];
                                        newOtp[idx] = val;
                                        setOtp(newOtp);

                                        if (val && idx < 5) {
                                            otpInputs.current[idx + 1].focus();
                                        }
                                    }}
                                    onPaste={handlePaste}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                                            otpInputs.current[idx - 1].focus();
                                        }
                                    }}
                                />
                            ))}
                        </div>

                        <button
                            className={`otp-verify-btn ${submittingOtp ? 'loading' : ''}`}
                            onClick={handleVerifyOtp}
                            disabled={submittingOtp}
                        >
                            {submittingOtp ? <div className="loader-inner"></div> : "Verify & Complete"}
                        </button>

                        <div className="otp-footer">
                            <p>Didn't receive the code?</p>
                            {resendCooldown > 0 ? (
                                <span className="resend-timer">Resend OTP in <strong>{formatTime(resendCooldown)}</strong></span>
                            ) : (
                                <button className="resend-btn" onClick={handleResendOtp}>Resend OTP</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
