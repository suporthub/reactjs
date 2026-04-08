import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Accounts from './components/accounts/Accounts';
import Dashboard from './components/dashboard/Dashboard';
import CopyTrading from './components/copy-trading/CopyTrading';
import Wallet from './components/wallet/Wallet';
import ReferAndEarn from './components/refer-and-earn/ReferAndEarn';
import Support from './components/support/Support';
import Settings from './components/settings/Settings';
import Calendar from './components/calendar/Calendar';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import TradingTerminal from './components/trading-terminal/TradingTerminal';
import IBRegistration from './components/ib/IBRegistration';
import AuthGuard from './components/auth/AuthGuard';
import './App.css';

import { useTranslation } from 'react-i18next';

// Map route paths to page names for sidebar active state
const routeToPage = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/accounts': 'Accounts',
  '/copy-trading': 'CopyTrading',
  '/wallet': 'Wallet',
  '/refer-and-earn': 'ReferAndEarn',
  '/settings': 'Settings',
  '/support': 'Support',
  '/calendar': 'Calendar',
  '/ib': 'IB',
};

// Map page names to route paths for navigation
const pageToRoute = {
  'Dashboard': '/dashboard',
  'Accounts': '/accounts',
  'CopyTrading': '/copy-trading',
  'Wallet': '/wallet',
  'ReferAndEarn': '/refer-and-earn',
  'Settings': '/settings',
  'Support': '/support',
  'Calendar': '/calendar',
  'IB': '/ib',
};

function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [copyTradingTab, setCopyTradingTab] = useState('Discover');
  const [walletTab, setWalletTab] = useState('Transactions');
  // Derive activePage from the current URL
  const activePage = routeToPage[location.pathname] || 'Dashboard';

  const isRTL = ['ar', 'ur'].includes(i18n.language);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Navigate using React Router instead of state
  const setActivePage = (page) => {
    const route = pageToRoute[page];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className={`app-container ${isRTL ? 'rtl' : ''}`}>
      <Topbar theme={theme} toggleTheme={toggleTheme} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="main-container">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activePage={activePage}
          setActivePage={setActivePage}
          copyTradingTab={copyTradingTab}
          setCopyTradingTab={setCopyTradingTab}
          walletTab={walletTab}
          setWalletTab={setWalletTab}
        />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/copy-trading" element={<CopyTrading activeTab={copyTradingTab} setActiveTab={setCopyTradingTab} />} />
          <Route path="/wallet" element={<Wallet activeTab={walletTab} setActiveTab={setWalletTab} />} />
          <Route path="/refer-and-earn" element={<ReferAndEarn />} />
          <Route path="/support" element={<Support />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ib" element={<IBRegistration />} />
        </Routes>
      </div>

    </div>
  );
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup/:referralCode" element={<Signup />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/trading-terminal" element={<TradingTerminal />} />
      <Route path="/*" element={<AuthGuard><DashboardLayout /></AuthGuard>} />
    </Routes>
  );
}

export default App;
