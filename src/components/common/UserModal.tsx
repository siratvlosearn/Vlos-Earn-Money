import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { X, UserCheck, Plus, Coins, ShieldCheck, Mail, Phone, Calendar, LogOut } from 'lucide-react';

interface UserModalProps {
  onClose: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ onClose }) => {
  const { user, setUser, reloadUser, userLogout, showToast, formatCoinsToCurrency } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.loginUser({
        email,
        name,
        referralCode: referralCode.trim() || undefined,
      });
      setUser(res.user);
      showToast('Welcome to VLØS EARN! 500 Coins welcome gift credited.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Account registration failed', 'error');
    }
  };

  const balanceFormatted = user ? formatCoinsToCurrency(user.coins) : { formatted: '$0.00' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200/90 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.15)] p-6 sm:p-7 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <X className="w-5 h-5" />
        </button>

        {!isRegistering ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <img
                src={user?.profilePhoto || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.email}`}
                alt={user?.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-red-500/40 shadow-xs"
              />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{user?.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                <div className="text-[10px] text-emerald-600 font-mono font-bold mt-0.5">
                  ID: {user?.id}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Total Coins:</span>
                <span className="text-amber-600 font-bold">{user?.coins.toLocaleString()} Coins</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Fiat Value:</span>
                <span className="text-slate-900 font-bold">{balanceFormatted.formatted}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Referral Code:</span>
                <span className="text-red-600 font-bold">{user?.referralCode}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => setIsRegistering(true)}
                className="w-full py-2.5 rounded-xl btn-3d-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-red-600" />
                <span>Switch or Create Earner Account</span>
              </button>

              <button
                onClick={() => {
                  userLogout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs active:translate-y-0.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Register Earner Account</h3>
              <p className="text-xs text-slate-500">Join the creator network & get 500 Welcome Coins</p>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="creator@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 shadow-2xs focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Creator"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 shadow-2xs focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Referral Code (Optional)</label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value)}
                  placeholder="VLOS2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono shadow-2xs focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-4 py-2.5 rounded-xl btn-3d-white text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl btn-3d-red text-xs font-bold"
                >
                  Create & Get 500 Coins
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
