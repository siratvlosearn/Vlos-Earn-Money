import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Currency, WithdrawalMethod, PlatformSettings, Notice } from '../types';
import { api } from '../services/api';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  reloadUser: () => Promise<void>;
  userLogin: (loginId: string, password?: string) => Promise<void>;
  userSignup: (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
  userLogout: () => void;
  currencies: Currency[];
  currentCurrency: Currency;
  setCurrencyCode: (code: string) => void;
  formatCoinsToCurrency: (coins: number) => { formatted: string; amount: number; symbol: string; code: string };
  paymentMethods: WithdrawalMethod[];
  settings: PlatformSettings | null;
  activeNotices: Notice[];
  isAdmin: boolean;
  adminUsername: string;
  adminLogin: (u: string, p: string) => Promise<void>;
  adminLogout: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  toasts: Toast[];
  currentPanel: 'user' | 'admin';
  setCurrentPanel: (panel: 'user' | 'admin') => void;
  reloadPlatformData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_CURRENCY: Currency = {
  id: 'curr_usd',
  code: 'USD',
  symbol: '$',
  name: 'US Dollar',
  exchangeRateToUSD: 1.0,
  coinConversionRate: 1000,
  minWithdrawal: 5.0,
  maxWithdrawal: 1000.0,
  withdrawalFeePercent: 1.5,
  status: 'enabled'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([DEFAULT_CURRENCY]);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('USD');
  const [paymentMethods, setPaymentMethods] = useState<WithdrawalMethod[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [activeNotices, setActiveNotices] = useState<Notice[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentPanel, setCurrentPanel] = useState<'user' | 'admin'>('user');

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const reloadUser = useCallback(async () => {
    const savedUserId = localStorage.getItem('vlos_user_id');
    if (!savedUserId && !user?.id) {
      setUser(null);
      return;
    }
    try {
      const res = await api.getCurrentUser(user?.id || savedUserId || undefined);
      setUser(res.user);
      if (res.user.currency) {
        setSelectedCurrencyCode(res.user.currency);
      }
    } catch (err) {
      console.error('Failed to reload user', err);
    }
  }, [user?.id]);

  const userLogin = async (loginId: string, password?: string) => {
    const res = await api.loginUser({ loginId, password });
    setUser(res.user);
    localStorage.setItem('vlos_user_id', res.user.id);
    if (res.user.currency) {
      setSelectedCurrencyCode(res.user.currency);
    }
    showToast(`Welcome back, ${res.user.name}!`, 'success');
  };

  const userSignup = async (name: string, email: string, password: string, referralCode?: string) => {
    const res = await api.signupUser({ name, email, password, referralCode });
    setUser(res.user);
    localStorage.setItem('vlos_user_id', res.user.id);
    showToast('Account created! 500 Welcome Coins added to your wallet.', 'success');
  };

  const userLogout = () => {
    localStorage.removeItem('vlos_user_id');
    setUser(null);
    showToast('You have been signed out.', 'info');
  };

  const reloadPlatformData = useCallback(async () => {
    try {
      const data = await api.getPlatformData();
      if (data.currencies && data.currencies.length > 0) {
        setCurrencies(data.currencies);
      }
      if (data.paymentMethods) {
        setPaymentMethods(data.paymentMethods);
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      if (data.activeNotices) {
        setActiveNotices(data.activeNotices);
      }
    } catch (err) {
      console.error('Failed to load platform data', err);
    }
  }, []);

  // Check admin session on mount
  useEffect(() => {
    async function checkAdmin() {
      const valid = await api.adminVerify();
      if (valid) {
        setIsAdmin(true);
        setAdminUsername('vlosearnbusiness');
      } else {
        setIsAdmin(false);
      }
    }
    checkAdmin();
    reloadUser();
    reloadPlatformData();
  }, [reloadUser, reloadPlatformData]);

  const adminLogin = async (u: string, p: string) => {
    const res = await api.adminLogin(u, p);
    setIsAdmin(true);
    setAdminUsername(res.admin.username);
    showToast('Admin authentication verified successfully', 'success');
  };

  const adminLogout = () => {
    api.removeAdminToken();
    setIsAdmin(false);
    setAdminUsername('');
    setCurrentPanel('user');
    showToast('Logged out of Admin Portal', 'info');
  };

  const currentCurrency = currencies.find(c => c.code === selectedCurrencyCode) || currencies[0] || DEFAULT_CURRENCY;

  const setCurrencyCode = (code: string) => {
    setSelectedCurrencyCode(code);
    if (user) {
      api.updateProfile({ userId: user.id, currency: code }).catch(console.error);
    }
  };

  const formatCoinsToCurrency = useCallback(
    (coins: number) => {
      const rate = currentCurrency.exchangeRateToUSD || 1.0;
      // 1000 Coins = 1 USD equivalent
      const amount = (coins / 1000) * rate;
      const formatted = `${currentCurrency.symbol}${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
      return {
        formatted,
        amount,
        symbol: currentCurrency.symbol,
        code: currentCurrency.code,
      };
    },
    [currentCurrency]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        reloadUser,
        userLogin,
        userSignup,
        userLogout,
        currencies,
        currentCurrency,
        setCurrencyCode,
        formatCoinsToCurrency,
        paymentMethods,
        settings,
        activeNotices,
        isAdmin,
        adminUsername,
        adminLogin,
        adminLogout,
        showToast,
        toasts,
        currentPanel,
        setCurrentPanel,
        reloadPlatformData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
