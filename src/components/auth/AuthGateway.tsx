import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Coins,
  AlertCircle
} from 'lucide-react';

interface AuthGatewayProps {
  onAdminClick?: () => void;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({ onAdminClick }) => {
  const { userLogin, userSignup, setCurrentPanel } = useApp();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  // Sign up fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim()) {
      setErrorMsg('Please enter your Email or Username');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await userLogin(loginId.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !signupPassword) {
      setErrorMsg('Please enter valid email and password');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await userSignup(name.trim() || 'New Earner', email.trim(), signupPassword, referralCode.trim() || undefined);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await userLogin('sirattuba.official@gmail.com', 'Sirat@2026$!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] selection:bg-red-600 selection:text-white">
      {/* 3D Soft Ambient Light Backdrops */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* 3D Elevated White Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200/90 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.08),0_8px_20px_-4px_rgba(15,23,42,0.04)] p-6 sm:p-8 space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {/* 3D Brand Badge */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-red-500 to-red-600 mx-auto flex items-center justify-center text-white font-black text-sm font-mono shadow-[0_6px_16px_rgba(220,38,38,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]">
            VLØS
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            Welcome to <span className="text-slate-900">VLOS</span> <span className="text-red-600">EARN</span>
          </h1>

          <div className="text-left pt-2 border-t border-slate-100 mt-4">
            {mode === 'login' ? (
              <div>
                <h2 className="text-lg font-bold text-slate-900">Login</h2>
                <p className="text-xs text-slate-500">Sign in to your account and continue earning.</p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Account</h2>
                <p className="text-xs text-slate-500">Start earning with creator missions & video ads.</p>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="leading-snug font-medium">{errorMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Email / Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginId}
                  onChange={e => setLoginId(e.target.value)}
                  placeholder="e.g. sirattuba.official@gmail.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-mono shadow-inner transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-mono shadow-inner transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 3D Red Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl btn-3d-red text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <span>LOGIN</span>
              )}
            </button>

            {/* Switch to Signup */}
            <div className="text-center pt-1">
              <span className="text-xs text-slate-500">Don't have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wide transition-colors"
              >
                SIGN UP
              </button>
            </div>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex Hunter"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="creator@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-mono transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Password
              </label>
              <input
                type="password"
                required
                value={signupPassword}
                onChange={e => setSignupPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-mono transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase flex items-center justify-between">
                <span>Referral Code (Optional)</span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">+100 bonus Coins</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value)}
                placeholder="e.g. VLOS2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-mono transition-all uppercase shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl btn-3d-red text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <span>SIGN UP & CLAIM 500 COINS</span>
              )}
            </button>

            {/* Switch to Login */}
            <div className="text-center pt-1">
              <span className="text-xs text-slate-500">Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wide transition-colors"
              >
                LOGIN
              </button>
            </div>
          </form>
        )}

        {/* 1-Click Test Demo Account Card (3D Light) */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Instant Demo Preview</div>
              <div className="text-[11px] text-amber-800 font-mono">Sirat Tuba (2,450 Coins)</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl btn-3d-white text-[11px] font-bold text-slate-800"
          >
            One-Click Login
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative px-3 bg-white text-[11px] font-mono uppercase text-slate-400 tracking-wider">
            ADMIN ACCESS
          </div>
        </div>

        {/* ADMIN LOGIN SECTION (3D Light Tactile Card) */}
        <div
          onClick={() => {
            if (onAdminClick) onAdminClick();
            else setCurrentPanel('admin');
          }}
          className="cursor-pointer group p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-white border border-slate-200/90 hover:border-red-400 hover:shadow-md transition-all flex items-center justify-between gap-3 active:translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 group-hover:text-red-600 transition-colors uppercase tracking-wider font-mono">
                ADMIN LOGIN
              </div>
              <div className="text-[11px] text-slate-500">
                Admin access only
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-red-600 group-hover:translate-x-1 transition-transform">
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
