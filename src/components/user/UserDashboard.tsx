import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Coins,
  ArrowUpRight,
  TrendingUp,
  Award,
  Users,
  Wallet,
  Clock,
  Sparkles,
  ChevronRight,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { Transaction } from '../../types';

interface UserDashboardProps {
  onNavigate: (tab: string) => void;
  recentTransactions: Transaction[];
  onOpenNoticeModal: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onNavigate,
  recentTransactions,
  onOpenNoticeModal
}) => {
  const { user, formatCoinsToCurrency, currentCurrency, activeNotices } = useApp();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" />
      </div>
    );
  }

  const primaryBalance = formatCoinsToCurrency(user.coins);
  const todayEarningsFormatted = formatCoinsToCurrency(user.todayEarnings);
  const totalEarningsFormatted = formatCoinsToCurrency(user.totalEarnings);
  const referralEarningsFormatted = formatCoinsToCurrency(user.referralEarnings);
  const availableWithdrawalFormatted = formatCoinsToCurrency(user.availableWithdrawalBalance);
  const pendingWithdrawalFormatted = formatCoinsToCurrency(user.pendingWithdrawal);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Active Notice Banner (3D Light Tint) */}
      {activeNotices.length > 0 && (
        <div
          onClick={onOpenNoticeModal}
          className="cursor-pointer bg-gradient-to-r from-red-50/90 via-white to-amber-50/60 border border-red-200/90 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-red-400 transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Zap className="w-5 h-5 text-red-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 font-mono">
                  ANNOUNCEMENT
                </span>
                <span className="text-xs text-slate-400">• Active</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                {activeNotices[0].title}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1">
                {activeNotices[0].message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-red-600 group-hover:translate-x-1 transition-transform shrink-0">
            <span>Read Details</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* User Welcome & Status Bar (3D Light Card) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={user.profilePhoto || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`}
              alt={user.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-red-500/30 shadow-xs"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 font-sans">{user.name}</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                ACTIVE CREATOR
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              ID: {user.id} • Ref Code: <span className="text-red-600 font-bold">{user.referralCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Anti-Abuse Protected</span>
          </div>
          <button
            onClick={() => onNavigate('tasks')}
            className="px-4 py-2 rounded-xl btn-3d-red text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start Earning</span>
          </button>
        </div>
      </div>

      {/* LARGE PREMIUM 3D LIGHT BALANCE CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#fafbfe] to-[#f1f5f9] border border-slate-200/90 p-6 sm:p-8 shadow-[0_15px_35px_-5px_rgba(15,23,42,0.06),0_4px_12px_-2px_rgba(15,23,42,0.02)]">
        {/* Subtle light ambient glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>TOTAL WALLET BALANCE</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-normal">
                {currentCurrency.name} ({currentCurrency.code})
              </span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
                {primaryBalance.formatted}
              </span>
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold font-mono shadow-2xs">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>{user.coins.toLocaleString()} Coins</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-sans">
              1,000 Coins = {currentCurrency.symbol}{(currentCurrency.exchangeRateToUSD).toFixed(2)} {currentCurrency.code}. Rates dynamically managed by platform administration.
            </p>
          </div>

          {/* Quick Action Buttons (3D Tactile) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onNavigate('wallet')}
              className="flex-1 sm:flex-none px-5 py-3 rounded-xl btn-3d-red text-xs font-bold flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Withdraw Funds</span>
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl btn-3d-white text-xs font-bold flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Browse Tasks</span>
            </button>
            <button
              onClick={() => onNavigate('watch')}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl btn-3d-white text-xs font-bold flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Watch Ads</span>
            </button>
          </div>
        </div>

        {/* Detailed Metrics Grid (3D Light Surfaces) */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Today's Earnings</div>
            <div className="text-sm font-bold text-emerald-600 font-mono mt-1">
              +{user.todayEarnings.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">Coins</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{todayEarningsFormatted.formatted}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Total Lifetime</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-1">
              {user.totalEarnings.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">Coins</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{totalEarningsFormatted.formatted}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Referral Earnings</div>
            <div className="text-sm font-bold text-purple-700 font-mono mt-1">
              {user.referralEarnings.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">Coins</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{referralEarningsFormatted.formatted}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Tasks Completed</div>
            <div className="text-sm font-bold text-amber-700 font-mono mt-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>{user.completedTasksCount} Done</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">100% Verified</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Available Payout</div>
            <div className="text-sm font-bold text-emerald-700 font-mono mt-1">
              {availableWithdrawalFormatted.formatted}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{user.availableWithdrawalBalance.toLocaleString()} Coins</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Pending Review</div>
            <div className="text-sm font-bold text-amber-700 font-mono mt-1">
              {pendingWithdrawalFormatted.formatted}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{user.pendingWithdrawal.toLocaleString()} Coins on Hold</div>
          </div>
        </div>
      </div>

      {/* Quick Nav Cards (3D Light Tactile Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task Center Card */}
        <div
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer group p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-red-300 hover:-translate-y-0.5 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 shadow-2xs">
              HIGH PAYOUT
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors">
            Micro Tasks & Missions
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Complete website visits, social channels, and web apps with our mandatory 10-second security countdown.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-red-600">
            <span>Explore Missions</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Watch & Earn Card */}
        <div
          onClick={() => onNavigate('watch')}
          className="cursor-pointer group p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
              INSTANT COINS
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
            Watch & Earn Video Ads
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Stream short premium creator spotlights and digital previews for instant wallet coin rewards.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-600">
            <span>Watch Trailers</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Referral Network Card */}
        <div
          onClick={() => onNavigate('referral')}
          className="cursor-pointer group p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
              10% COMMISSION
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
            Invite & Earn Program
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Earn 100 Coins instant bonus plus lifetime commission whenever your referred creators complete tasks.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-600">
            <span>Copy Referral Link</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Recent Financial Transactions Ledger (3D Light Card) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Activity & Transactions</h3>
            <p className="text-xs text-slate-500">Real-time ledger of completed tasks, bonuses, and withdrawals</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No transactions yet. Complete your first task above to earn coins!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.slice(0, 5).map(tx => {
              const isCredit = tx.amount > 0;
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                        tx.type === 'Withdrawal'
                          ? 'bg-amber-100 text-amber-700'
                          : tx.type === 'Withdrawal Refund'
                          ? 'bg-blue-100 text-blue-700'
                          : isCredit
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {tx.type === 'Withdrawal' ? (
                        <Wallet className="w-4 h-4" />
                      ) : (
                        <Coins className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{tx.description}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString()} • {tx.type}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs font-bold font-mono ${
                        isCredit ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {isCredit ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} Coins
                    </div>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold ${
                        tx.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : tx.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
