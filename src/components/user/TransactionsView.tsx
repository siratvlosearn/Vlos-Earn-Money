import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Transaction, TransactionType } from '../../types';
import {
  Coins,
  Wallet,
  ArrowDownToLine,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const { user, showToast } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('All');

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getTransactions(user.id);
      setTransactions(res.transactions || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load transaction ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user?.id]);

  const types = [
    'All',
    'Task Reward',
    'Video Reward',
    'Referral Reward',
    'Withdrawal',
    'Withdrawal Refund',
    'Admin Adjustment',
  ];

  const filtered = transactions.filter(t => {
    if (filterType === 'All') return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 3D Light Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Financial & Coin Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete cryptographic audit trail of all earnings, task completions, and withdrawals.
          </p>
        </div>
      </div>

      {/* Filter Tabs (3D Light Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === t
                ? 'btn-3d-red text-white shadow-sm font-bold'
                : 'btn-3d-white text-slate-600 hover:text-slate-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Transactions List (3D Light Card) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No transactions match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(tx => {
              const isCredit = tx.amount > 0;
              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
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
                        <ArrowDownToLine className="w-5 h-5" />
                      ) : tx.type === 'Withdrawal Refund' ? (
                        <RotateCcw className="w-5 h-5" />
                      ) : (
                        <Coins className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{tx.description}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                        {new Date(tx.createdAt).toLocaleTimeString()} • {tx.type} • ID #{tx.id.slice(-6).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-bold font-mono ${
                        isCredit ? 'text-emerald-600' : 'text-amber-700'
                      }`}
                    >
                      {isCredit ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} Coins
                    </div>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-md ${
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
