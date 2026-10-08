import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Users,
  Copy,
  Check,
  Share2,
  TrendingUp,
  Coins,
  Award,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Send,
  Twitter
} from 'lucide-react';

export const ReferralView: React.FC = () => {
  const { user, formatCoinsToCurrency, showToast } = useApp();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  const referralCode = user?.referralCode || 'VLOS2026';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const fetchReferralData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getReferrals(user.id);
      setReferrals(res.referrals || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch referral data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, [user?.id]);

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      showToast('Referral code copied to clipboard!', 'success');
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      showToast('Referral link copied to clipboard!', 'success');
    }
  };

  const shareViaSocial = (platform: 'whatsapp' | 'telegram' | 'twitter') => {
    const text = encodeURIComponent(
      `Join me on VLØS EARN to earn real money completing creator missions & watching video ads! Use my code: ${referralCode}\n${referralLink}`
    );
    let url = '';
    if (platform === 'whatsapp') url = `https://api.whatsapp.com/send?text=${text}`;
    if (platform === 'telegram') url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`;
    if (platform === 'twitter') url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank');
  };

  const referralEarningsFormatted = user ? formatCoinsToCurrency(user.referralEarnings) : { formatted: '$0.00' };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 3D Light Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-50/80 via-white to-pink-50/60 border border-purple-200/90 p-6 sm:p-8 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-mono font-bold shadow-2xs border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>VLØS CREATOR PARTNER NETWORK</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Invite Creators, Earn <span className="text-purple-600">10% Lifetime</span> Commissions
          </h1>

          <p className="text-xs text-slate-600 leading-relaxed">
            Receive <span className="text-amber-600 font-bold">100 Coins</span> instantly when your invitee completes their first task, plus <span className="text-purple-600 font-bold">10% commission</span> on all tasks they complete forever.
          </p>
        </div>
      </div>

      {/* Referral Code & Link Box (3D Light Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Code Box */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 space-y-3 shadow-xs">
          <span className="text-xs font-mono uppercase font-bold text-slate-500">YOUR UNIQUE REFERRAL CODE</span>
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-xl font-black text-slate-900 font-mono tracking-wider">{referralCode}</span>
            <button
              onClick={() => copyToClipboard(referralCode, 'code')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/25 active:translate-y-0.5 flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Link Box */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 space-y-3 shadow-xs">
          <span className="text-xs font-mono uppercase font-bold text-slate-500">INVITATION URL</span>
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-700 font-mono truncate">{referralLink}</span>
            <button
              onClick={() => copyToClipboard(referralLink, 'link')}
              className="px-4 py-2 rounded-xl btn-3d-white text-xs font-bold shrink-0 flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Social Share Buttons */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <span className="text-xs font-semibold text-slate-700">Quick Share To Friends & Groups:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shareViaSocial('whatsapp')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={() => shareViaSocial('telegram')}
            className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Send className="w-4 h-4 text-sky-600" />
            <span>Telegram</span>
          </button>
          <button
            onClick={() => shareViaSocial('twitter')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Twitter className="w-4 h-4 text-blue-600" />
            <span>X / Twitter</span>
          </button>
        </div>
      </div>

      {/* Referral Performance Metrics (3D Light Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold">Total Referrals</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">
            {user?.totalReferrals || 0} <span className="text-xs text-slate-400 font-normal">Creators</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold">Active Referrals</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-2">
            {user?.activeReferrals || 0} <span className="text-xs text-slate-400 font-normal">Active</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold">Referral Earnings</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-2">
            {(user?.referralEarnings || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">Coins</span>
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">{referralEarningsFormatted.formatted}</div>
        </div>
      </div>

      {/* Referral History Table (3D Light Table Card) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">Referred Creators History</h3>

        {referrals.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No referred creators yet. Share your code to earn 10% lifetime commission!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {referrals.map((ref: any) => (
              <div key={ref.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                    {ref.referredUserName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{ref.referredUserName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Joined {new Date(ref.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600 font-mono">
                    +{ref.bonusCoins} Coins
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {ref.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
