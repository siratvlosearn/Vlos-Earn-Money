import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { WithdrawalMethod, WithdrawalRequest } from '../../types';
import {
  Wallet,
  ArrowDownToLine,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Smartphone,
  CreditCard,
  Send,
  Coins,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';

export const WalletView: React.FC = () => {
  const { user, reloadUser, currentCurrency, formatCoinsToCurrency, showToast } = useApp();
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod | null>(null);

  // Form states
  const [amountCoins, setAmountCoins] = useState<string>('5000');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWalletData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [methodsRes, wdRes] = await Promise.all([
        api.getPaymentMethods(),
        api.getMyWithdrawals(user.id),
      ]);
      setMethods(methodsRes.paymentMethods.filter(m => m.status === 'enabled'));
      if (methodsRes.paymentMethods.length > 0 && !selectedMethod) {
        setSelectedMethod(methodsRes.paymentMethods[0]);
      }
      setWithdrawals(wdRes.withdrawals || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load wallet data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user?.id]);

  const handleFieldChange = (fieldId: string, val: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: val }));
  };

  // Live conversions & calculations
  const parsedCoins = parseInt(amountCoins, 10) || 0;
  const fiatEquivalent = (parsedCoins / 1000) * currentCurrency.exchangeRateToUSD;

  let feeAmount = 0;
  if (selectedMethod) {
    if (selectedMethod.feeType === 'percentage') {
      feeAmount = (fiatEquivalent * (selectedMethod.withdrawalFee || 0)) / 100;
    } else {
      feeAmount = selectedMethod.withdrawalFee || 0;
    }
  }
  const finalPayout = Math.max(0, fiatEquivalent - feeAmount);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMethod) return;

    if (parsedCoins <= 0) {
      showToast('Please enter a valid coin withdrawal amount', 'error');
      return;
    }

    if (user.availableWithdrawalBalance < parsedCoins) {
      showToast(
        `Insufficient available balance. You have ${user.availableWithdrawalBalance.toLocaleString()} Coins available.`,
        'error'
      );
      return;
    }

    // Validate required fields
    for (const f of selectedMethod.requiredFields) {
      if (f.required && (!fieldValues[f.fieldId] || !fieldValues[f.fieldId].trim())) {
        showToast(`Please provide ${f.label}`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await api.createWithdrawal({
        userId: user.id,
        methodId: selectedMethod.id,
        amountCoins: parsedCoins,
        accountInfo: fieldValues,
        currencyCode: currentCurrency.code,
      });

      showToast(res.message, 'success');
      setFieldValues({});
      await reloadUser();
      await fetchWalletData();
    } catch (err: any) {
      showToast(err.message || 'Withdrawal failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getMethodIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'bkash':
      case 'nagad':
        return <Smartphone className="w-5 h-5 text-pink-600" />;
      case 'bank transfer':
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'paypal':
        return <Send className="w-5 h-5 text-indigo-600" />;
      case 'redotpay':
        return <CreditCard className="w-5 h-5 text-red-600" />;
      case 'tonkeeper (ton)':
      case 'tonkeeper':
        return <Coins className="w-5 h-5 text-sky-600" />;
      default:
        return <Wallet className="w-5 h-5 text-slate-600" />;
    }
  };

  const availableBalanceFormatted = user ? formatCoinsToCurrency(user.availableWithdrawalBalance) : { formatted: '$0.00' };
  const pendingBalanceFormatted = user ? formatCoinsToCurrency(user.pendingWithdrawal) : { formatted: '$0.00' };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 3D Light Balances Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 border border-slate-200/90 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,1)]">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase font-semibold">
            <span>Available For Withdrawal</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono mt-2 tracking-tight">
            {availableBalanceFormatted.formatted}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-mono font-bold mt-1">
            <Coins className="w-3.5 h-3.5" />
            <span>{user?.availableWithdrawalBalance.toLocaleString()} Coins</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-amber-50/40 border border-slate-200/90 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,1)]">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase font-semibold">
            <span>Pending Payout Hold</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-700 font-mono mt-2 tracking-tight">
            {pendingBalanceFormatted.formatted}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-1">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{user?.pendingWithdrawal.toLocaleString()} Coins held in escrow</span>
          </div>
        </div>
      </div>

      {/* Main Withdrawal Section (3D Light Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method Picker & Form */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-red-600" />
              <span>Submit Withdrawal Request</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your payout destination. Balance is held safely during admin verification.
            </p>
          </div>

          {/* Payment Method Selector Grid */}
          <div className="space-y-2.5">
            <label className="text-xs font-mono font-bold text-slate-700 uppercase">
              1. Select Withdrawal Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {methods.map(m => {
                const isSelected = selectedMethod?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(m);
                      setFieldValues({});
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-red-50/80 border-2 border-red-500 text-slate-900 shadow-sm shadow-red-500/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-xl bg-slate-100 shadow-2xs">{getMethodIcon(m.name)}</div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {m.currency}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{m.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Min: {currentCurrency.symbol}{m.minWithdrawal}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedMethod && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-5 pt-3 border-t border-slate-100">
              {/* Instructions Callout */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed shadow-2xs">
                <span className="text-red-600 font-bold">{selectedMethod.name} Instructions: </span>
                {selectedMethod.instructions}
              </div>

              {/* Dynamic Required Account Fields */}
              <div className="space-y-3">
                <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                  2. Account Credentials & Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedMethod.requiredFields.map(f => (
                    <div key={f.fieldId} className="space-y-1">
                      <label className="text-[11px] text-slate-600 font-medium flex items-center justify-between">
                        <span>{f.label}</span>
                        {f.required && <span className="text-red-600 text-[10px] font-bold">*Required</span>}
                      </label>
                      <input
                        type={f.type || 'text'}
                        required={f.required}
                        value={fieldValues[f.fieldId] || ''}
                        onChange={e => handleFieldChange(f.fieldId, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-mono transition-all shadow-2xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount to Withdraw in Coins */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-700 uppercase flex items-center justify-between">
                  <span>3. Withdrawal Amount (Coins)</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Available: {user?.availableWithdrawalBalance.toLocaleString()} Coins
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={amountCoins}
                    onChange={e => setAmountCoins(e.target.value)}
                    className="w-full pl-4 pr-24 py-3 rounded-xl bg-white border border-slate-200 text-base text-slate-900 font-mono font-bold focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all shadow-2xs"
                  />
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAmountCoins(String(user?.availableWithdrawalBalance || 0))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition-colors shadow-2xs"
                    >
                      MAX
                    </button>
                    <span className="text-xs text-slate-400 font-mono px-1">Coins</span>
                  </div>
                </div>
              </div>

              {/* Live Fee & Calculation Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono shadow-2xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Gross Value ({currentCurrency.code}):</span>
                  <span className="text-slate-900 font-bold">{currentCurrency.symbol}{fiatEquivalent.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Gateway Fee ({selectedMethod.withdrawalFee}{selectedMethod.feeType === 'percentage' ? '%' : currentCurrency.symbol}):</span>
                  <span className="text-amber-700 font-bold">-{currentCurrency.symbol}{feeAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="text-slate-900 font-bold">Net Payout Received:</span>
                  <span className="text-emerald-600 font-black">{currentCurrency.symbol}{finalPayout.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || parsedCoins <= 0}
                className="w-full py-3.5 rounded-xl btn-3d-red text-xs font-bold transition-all shadow-md shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Secure Request...</span>
                  </div>
                ) : (
                  <span>Submit Withdrawal Request</span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Security & Anti-Fraud Notice */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Withdrawal Security Protocol</span>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-1.5" />
                <p>
                  <strong className="text-slate-900">Balance Holding:</strong> Coins are deducted immediately upon request so double withdrawals are impossible.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-1.5" />
                <p>
                  <strong className="text-slate-900">Rejection Reversal:</strong> If an admin rejects your request (e.g. incorrect account details), your coins are automatically restored to your wallet.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-1.5" />
                <p>
                  <strong className="text-slate-900">Audit Trail:</strong> Every withdrawal request generates a permanent immutable ledger reference.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 shadow-2xs">
              <Info className="w-4 h-4 text-slate-400 mb-1" />
              <span>Notice: Live external gateway endpoints (bKash/Nagad/PayPal/RedotPay/Tonkeeper API credentials) are integrated server-side.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal History Table (3D Light Card) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">My Withdrawal Requests</h3>

        {withdrawals.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No withdrawal requests submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="pb-3 font-semibold">Reference ID</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Coins Deducted</th>
                  <th className="pb-3 font-semibold">Net Payout</th>
                  <th className="pb-3 font-semibold">Submitted</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map(w => (
                  <tr key={w.id} className="text-slate-700">
                    <td className="py-3.5 font-mono font-bold text-slate-900">
                      #{w.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 font-semibold text-slate-900">
                      {w.methodName}
                    </td>
                    <td className="py-3.5 font-mono text-amber-700 font-bold">
                      -{w.coinsDeducted.toLocaleString()} Coins
                    </td>
                    <td className="py-3.5 font-mono font-bold text-emerald-600">
                      {currentCurrency.symbol}{w.finalAmount.toFixed(2)} {w.currency}
                    </td>
                    <td className="py-3.5 text-[11px] text-slate-400 font-mono">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                          w.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : w.status === 'Approved'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : w.status === 'Rejected'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {w.status}
                      </span>
                      {w.status === 'Rejected' && w.rejectionReason && (
                        <div className="text-[10px] text-red-600 mt-1 font-medium">
                          Reason: {w.rejectionReason} (Balance refunded)
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
