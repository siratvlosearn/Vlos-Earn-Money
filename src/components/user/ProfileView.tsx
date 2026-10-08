import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  UserCheck,
  Shield,
  Coins,
  Globe,
  Save,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  Fingerprint,
  LogOut
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, reloadUser, userLogout, currencies, currentCurrency, setCurrencyCode, showToast } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await api.updateProfile({
        userId: user.id,
        name,
        phone,
        profilePhoto,
      });
      showToast('Profile updated successfully!', 'success');
      await reloadUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Profile Overview Card (3D Light Surface) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={profilePhoto || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.email}`}
                alt={user?.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-red-500/40 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">{user?.name}</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shadow-2xs">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{user?.email}</p>
              <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                <span>User ID: {user?.id}</span>
                <span>•</span>
                <span>Ref Code: {user?.referralCode}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-2xs">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Total Coins</div>
              <div className="text-base font-black text-amber-600 font-mono mt-0.5">
                {user?.coins.toLocaleString()}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-2xs">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Tasks Completed</div>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                {user?.completedTasksCount}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-sans shadow-2xs transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Mobile Phone</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+880 1700 000000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-mono shadow-2xs transition-all"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Avatar Photo URL</label>
              <input
                type="url"
                value={profilePhoto}
                onChange={e => setProfilePhoto(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-mono shadow-2xs transition-all"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={userLogout}
              className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:translate-y-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl btn-3d-red text-xs font-bold transition-all shadow-md shadow-red-600/30 flex items-center gap-2"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Profile Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Account Preferences Card (3D Light Surface) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-red-600" />
          <span>Default Display Currency</span>
        </h3>
        <p className="text-xs text-slate-500">
          Select which fiat or Web3 currency balance is displayed across your creator dashboard.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {currencies.map(c => (
            <button
              key={c.id}
              onClick={() => setCurrencyCode(c.code)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                c.code === currentCurrency.code
                  ? 'bg-red-50/80 border-2 border-red-500 text-slate-900 font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <div className="text-sm font-mono text-red-600 font-bold">{c.symbol} {c.code}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">{c.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
