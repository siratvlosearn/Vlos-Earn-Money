import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Coins,
  Shield,
  Layers,
  ChevronDown,
  Bell,
  Lock,
  Globe,
  LogOut,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  onOpenUserModal: () => void;
  onOpenNoticeModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenUserModal, onOpenNoticeModal }) => {
  const {
    user,
    userLogout,
    currencies,
    currentCurrency,
    setCurrencyCode,
    formatCoinsToCurrency,
    isAdmin,
    currentPanel,
    setCurrentPanel,
    activeNotices
  } = useApp();

  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const formattedBalance = user ? formatCoinsToCurrency(user.coins) : null;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.04)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setCurrentPanel('user')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            {/* 3D Tactile Logo Emblem */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-red-500 via-red-600 to-red-700 flex items-center justify-center text-white font-black shadow-[0_4px_12px_rgba(220,38,38,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] group-hover:scale-105 transition-all">
              <span className="tracking-tighter text-sm font-mono font-bold">VLØS</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wider text-slate-900 flex items-center gap-1.5 font-sans">
                VLØS <span className="text-red-600">EARN</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 font-bold hidden sm:inline-block shadow-2xs">
                  PRO
                </span>
              </span>
              <span className="text-[10px] text-slate-500 tracking-tight hidden sm:block">
                Creator & Task Economy
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right Control Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Multi-Currency Dropdown (3D Light Button) */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all active:translate-y-0.5"
              title="Select Display Currency"
            >
              <Globe className="w-3.5 h-3.5 text-red-600" />
              <span className="font-mono font-bold">{currentCurrency.symbol} {currentCurrency.code}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showCurrencyDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowCurrencyDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200/90 shadow-xl z-40 py-2 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                    Select Currency
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {currencies.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCurrencyCode(c.code);
                          setShowCurrencyDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors ${
                          c.code === currentCurrency.code
                            ? 'bg-red-50 text-red-600 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 font-mono text-center text-red-600 font-bold">{c.symbol}</span>
                          <span className="font-medium">{c.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">1 USD = {c.exchangeRateToUSD}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Active Notice Bell */}
          {activeNotices.length > 0 && (
            <button
              onClick={onOpenNoticeModal}
              className="relative p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-slate-600 hover:text-slate-900 transition-all active:translate-y-0.5"
              title="Platform Announcements"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </button>
          )}

          {/* User Balance Chip (when in user mode) */}
          {user && (
            <div
              onClick={onOpenUserModal}
              className="cursor-pointer hidden xs:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-red-400/80 transition-all active:translate-y-0.5"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shadow-2xs">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 font-mono leading-none">
                  {user.coins.toLocaleString()} <span className="text-[10px] text-amber-600 font-normal">Coins</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold leading-none mt-0.5">
                  ≈ {formattedBalance?.formatted}
                </span>
              </div>
            </div>
          )}

          {/* Panel Switcher Button (3D Light Pill) */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 shadow-inner">
            <button
              onClick={() => setCurrentPanel('user')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentPanel === 'user'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">User</span>
            </button>

            <button
              onClick={() => setCurrentPanel('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentPanel === 'admin'
                  ? 'btn-3d-red font-bold text-white shadow-sm'
                  : 'text-slate-500 hover:text-red-600'
              }`}
            >
              {isAdmin ? (
                <Shield className="w-3.5 h-3.5 text-white" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>Admin</span>
            </button>
          </div>

          {/* User Profile Avatar & Sign Out */}
          {user && (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenUserModal}
                className="w-9 h-9 rounded-xl border border-slate-200 shadow-xs hover:border-red-500 overflow-hidden shrink-0 transition-colors"
                title={`${user.name} (${user.email})`}
              >
                <img
                  src={user.profilePhoto || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </button>

              <button
                onClick={userLogout}
                className="p-2 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 shadow-2xs transition-colors active:translate-y-0.5"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
