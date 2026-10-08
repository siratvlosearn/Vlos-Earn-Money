import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  User,
  Task,
  VideoAd,
  Currency,
  WithdrawalMethod,
  WithdrawalRequest,
  Notice,
  AdminAuditLog,
  PlatformSettings,
  TaskCategory
} from '../../types';
import {
  Shield,
  LayoutDashboard,
  Users,
  CheckSquare,
  PlaySquare,
  ArrowDownToLine,
  Globe,
  CreditCard,
  Bell,
  Settings,
  FileText,
  LogOut,
  TrendingUp,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Coins,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { adminUsername, adminLogout, showToast, reloadPlatformData, currentCurrency } = useApp();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Data states
  const [userList, setUserList] = useState<User[]>([]);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [adList, setAdList] = useState<VideoAd[]>([]);
  const [withdrawalList, setWithdrawalList] = useState<WithdrawalRequest[]>([]);
  const [currencyList, setCurrencyList] = useState<Currency[]>([]);
  const [methodList, setMethodList] = useState<WithdrawalMethod[]>([]);
  const [noticeList, setNoticeList] = useState<Notice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  // User detail & balance edit modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBalanceModal, setShowBalanceModal] = useState<boolean>(false);
  const [balanceAction, setBalanceAction] = useState<'add' | 'remove'>('add');
  const [balanceAmount, setBalanceAmount] = useState<string>('500');
  const [balanceReason, setBalanceReason] = useState<string>('');

  // Task form modal
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);

  // Ad form modal
  const [showAdModal, setShowAdModal] = useState<boolean>(false);
  const [editingAd, setEditingAd] = useState<Partial<VideoAd> | null>(null);

  // Currency form modal
  const [showCurrencyModal, setShowCurrencyModal] = useState<boolean>(false);
  const [editingCurrency, setEditingCurrency] = useState<Partial<Currency> | null>(null);

  // Payment Method form modal
  const [showMethodModal, setShowMethodModal] = useState<boolean>(false);
  const [editingMethod, setEditingMethod] = useState<Partial<WithdrawalMethod> | null>(null);

  // Notice form modal
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);
  const [editingNotice, setEditingNotice] = useState<Partial<Notice> | null>(null);

  // Withdrawal rejection modal
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Account details verification failed');

  // Load Admin Data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        usersRes,
        tasksRes,
        adsRes,
        wdsRes,
        currenciesRes,
        methodsRes,
        noticesRes,
        logsRes,
        settingsRes
      ] = await Promise.all([
        api.adminGetStats(),
        api.adminGetUsers(),
        api.getTasks(),
        api.getAds(),
        api.adminGetWithdrawals(),
        api.adminGetCurrencies(),
        api.adminGetPaymentMethods(),
        api.adminGetNotices(),
        api.adminGetAuditLogs(),
        api.adminGetSettings(),
      ]);

      setStats(statsRes);
      setUserList(usersRes.users || []);
      setTaskList(tasksRes.tasks || []);
      setAdList(adsRes.ads || []);
      setWithdrawalList(wdsRes.withdrawals || []);
      setCurrencyList(currenciesRes.currencies || []);
      setMethodList(methodsRes.paymentMethods || []);
      setNoticeList(noticesRes.notices || []);
      setAuditLogs(logsRes.auditLogs || []);
      setPlatformSettings(settingsRes.settings);
    } catch (err: any) {
      showToast(err.message || 'Failed to load administrative data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // ----------------------------------------------------
  // USER OPERATIONS
  // ----------------------------------------------------
  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!balanceReason.trim()) {
      showToast('A reason is mandatory for any balance modification', 'error');
      return;
    }

    try {
      await api.adminUpdateUserBalance(selectedUser.id, {
        amount: parseInt(balanceAmount, 10),
        action: balanceAction,
        reason: balanceReason,
      });
      showToast('User balance updated and audit log recorded', 'success');
      setShowBalanceModal(false);
      setBalanceReason('');
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Balance update failed', 'error');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await api.adminUpdateUserStatus(user.id, {
        status: nextStatus,
        reason: `Status switched to ${nextStatus} by admin`,
      });
      showToast(`User status updated to ${nextStatus}`, 'success');
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status', 'error');
    }
  };

  // ----------------------------------------------------
  // WITHDRAWAL OPERATIONS (APPROVE / REJECT / PAID)
  // ----------------------------------------------------
  const handleUpdateWithdrawal = async (id: string, status: 'Approved' | 'Paid' | 'Rejected') => {
    if (status === 'Rejected') {
      const wd = withdrawalList.find(w => w.id === id);
      setRejectingWithdrawal(wd || null);
      return;
    }

    try {
      await api.adminUpdateWithdrawalStatus(id, { status });
      showToast(`Withdrawal marked as ${status}`, 'success');
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectingWithdrawal) return;
    try {
      await api.adminUpdateWithdrawalStatus(rejectingWithdrawal.id, {
        status: 'Rejected',
        rejectionReason,
      });
      showToast('Withdrawal rejected. Held balance automatically refunded to user.', 'info');
      setRejectingWithdrawal(null);
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject withdrawal', 'error');
    }
  };

  // ----------------------------------------------------
  // TASK SAVE / DELETE
  // ----------------------------------------------------
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      await api.adminSaveTask(editingTask);
      showToast('Task saved successfully', 'success');
      setShowTaskModal(false);
      setEditingTask(null);
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save task', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.adminDeleteTask(taskId);
      showToast('Task removed', 'success');
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  // ----------------------------------------------------
  // AD SAVE / DELETE
  // ----------------------------------------------------
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd) return;
    try {
      await api.adminSaveAd(editingAd);
      showToast('Video ad saved successfully', 'success');
      setShowAdModal(false);
      setEditingAd(null);
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save ad', 'error');
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this video ad?')) return;
    try {
      await api.adminDeleteAd(adId);
      showToast('Video ad removed', 'success');
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete ad', 'error');
    }
  };

  // ----------------------------------------------------
  // CURRENCY SAVE / DELETE
  // ----------------------------------------------------
  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCurrency) return;
    try {
      await api.adminSaveCurrency(editingCurrency);
      showToast('Currency settings saved', 'success');
      setShowCurrencyModal(false);
      setEditingCurrency(null);
      await reloadPlatformData();
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save currency', 'error');
    }
  };

  const handleDeleteCurrency = async (currId: string) => {
    if (!confirm('Are you sure you want to delete this currency?')) return;
    try {
      await api.adminDeleteCurrency(currId);
      showToast('Currency removed', 'success');
      await reloadPlatformData();
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete currency', 'error');
    }
  };

  // ----------------------------------------------------
  // PAYMENT METHOD SAVE / DELETE
  // ----------------------------------------------------
  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;
    try {
      await api.adminSavePaymentMethod(editingMethod);
      showToast('Withdrawal method updated', 'success');
      setShowMethodModal(false);
      setEditingMethod(null);
      await reloadPlatformData();
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save payment method', 'error');
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    try {
      await api.adminDeletePaymentMethod(methodId);
      showToast('Payment method removed', 'success');
      await reloadPlatformData();
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete method', 'error');
    }
  };

  // ----------------------------------------------------
  // NOTICE SAVE / DELETE
  // ----------------------------------------------------
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;
    try {
      await api.adminSaveNotice(editingNotice);
      showToast('Notice saved', 'success');
      setShowNoticeModal(false);
      setEditingNotice(null);
      await reloadPlatformData();
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save notice', 'error');
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.adminDeleteNotice(noticeId);
      showToast('Notice removed', 'success');
      await reloadPlatformData();
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete notice', 'error');
    }
  };

  // ----------------------------------------------------
  // SETTINGS SAVE
  // ----------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformSettings) return;
    try {
      await api.adminUpdateSettings(platformSettings);
      showToast('Platform settings updated', 'success');
      await reloadPlatformData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users, badge: userList.length },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: taskList.length },
    { id: 'ads', label: 'Video Ads', icon: PlaySquare, badge: adList.length },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowDownToLine, badge: withdrawalList.filter(w => w.status === 'Pending').length },
    { id: 'currencies', label: 'Currencies', icon: Globe, badge: currencyList.length },
    { id: 'paymentMethods', label: 'Payment Methods', icon: CreditCard, badge: methodList.length },
    { id: 'notices', label: 'Notices & Popups', icon: Bell, badge: noticeList.length },
    { id: 'referrals', label: 'Referral Settings', icon: TrendingUp },
    { id: 'auditLogs', label: 'Audit Logs', icon: FileText, badge: auditLogs.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row pb-16 md:pb-0 font-sans selection:bg-red-600 selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/90 shrink-0 flex flex-col justify-between shadow-2xs">
        <div className="p-4 space-y-4">
          {/* Admin Header Chip */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 font-mono">{adminUsername}</div>
                <div className="text-[10px] text-red-400 font-mono font-semibold">SUPERADMIN ROLE</div>
              </div>
            </div>
            <button
              onClick={adminLogout}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors shadow-2xs"
              title="Logout from Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'btn-3d-red text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? 'bg-white text-red-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Status info */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>VLØS Engine:</span>
            <span className="text-emerald-400 font-bold">ONLINE (v2.6)</span>
          </div>
          <button
            onClick={loadAdminData}
            className="w-full py-2 rounded-xl btn-3d-white text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh State</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h1>
                <p className="text-xs text-slate-500 mt-0.5">Platform telemetry and performance indicators</p>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <div className="text-[10px] font-mono uppercase text-slate-500">Total Users</div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                  {stats?.totalUsers || 0}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-1">
                  {stats?.activeUsers || 0} active • {stats?.suspendedUsers || 0} suspended
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <div className="text-[10px] font-mono uppercase text-slate-500">Task Missions</div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                  {stats?.totalTasks || 0}
                </div>
                <div className="text-[11px] text-amber-400 font-mono mt-1">
                  {stats?.completedTasks || 0} verified completions
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <div className="text-[10px] font-mono uppercase text-slate-500">Video Ad Views</div>
                <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                  {(stats?.totalVideoViews || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">Duration enforced</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <div className="text-[10px] font-mono uppercase text-slate-500">Total Coins Minted</div>
                <div className="text-2xl font-black text-red-500 font-mono mt-1">
                  {(stats?.totalCoinsIssued || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">All ledger credits</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <div className="text-[10px] font-mono uppercase text-slate-500">Pending Withdrawals</div>
                <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                  {stats?.pendingWithdrawalsCount || 0}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  ${stats?.pendingWithdrawalsAmount || 0} awaiting review
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <div className="text-[10px] font-mono uppercase text-slate-500">Settled Payouts</div>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                  {stats?.paidWithdrawalsCount || 0}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-1">
                  ${stats?.paidWithdrawalsAmount || 0} total paid
                </div>
              </div>
            </div>

            {/* Quick Action Tables in Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Pending Withdrawals */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ArrowDownToLine className="w-4 h-4 text-amber-400" />
                    <span>Pending Withdrawals Requiring Action</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('withdrawals')}
                    className="text-xs text-red-400 font-semibold hover:underline"
                  >
                    View All
                  </button>
                </div>

                {withdrawalList.filter(w => w.status === 'Pending').length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No pending withdrawals requiring review.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {withdrawalList.filter(w => w.status === 'Pending').slice(0, 4).map(w => (
                      <div key={w.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{w.userName} ({w.methodName})</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Amount: {w.currency} {w.finalAmount} (-{w.coinsDeducted} Coins)
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateWithdrawal(w.id, 'Approved')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateWithdrawal(w.id, 'Rejected')}
                            className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-[11px]"
                          >
                            Reject & Refund
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Latest Audit Logs */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>Recent Administrative Audit Logs</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('auditLogs')}
                    className="text-xs text-red-400 font-semibold hover:underline"
                  >
                    Full Logs
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {auditLogs.slice(0, 4).map(log => (
                    <div key={log.id} className="py-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-400">{log.action}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">{log.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: USERS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Account Management</h1>
                <p className="text-xs text-slate-500">View user balances, modify coins, and audit activity</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Balance</th>
                    <th className="pb-3">Lifetime Earnings</th>
                    <th className="pb-3">Ref Code</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userList.map(u => (
                    <tr key={u.id} className="text-slate-600">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.profilePhoto || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.email}`}
                            alt={u.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono font-bold text-amber-400">
                        {u.coins.toLocaleString()} Coins
                      </td>
                      <td className="py-3 font-mono text-slate-600">
                        {u.totalEarnings.toLocaleString()} Coins
                      </td>
                      <td className="py-3 font-mono text-slate-500">
                        {u.referralCode}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowBalanceModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-amber-700 font-bold text-[11px] font-semibold transition-colors"
                        >
                          Modify Balance
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            u.status === 'active'
                              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                              : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TASKS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Task System Management</h1>
                <p className="text-xs text-slate-500">Configure tasks, reward coins, 10s countdown, and requirements</p>
              </div>
              <button
                onClick={() => {
                  setEditingTask({
                    name: '',
                    description: '',
                    category: 'Website Visit',
                    url: 'https://',
                    reward: 50,
                    timer: 30,
                    countdownDuration: 10,
                    dailyLimit: 3,
                    totalLimit: 5000,
                    instructions: 'Wait for 10-second countdown then browse the site for the full duration.',
                    status: 'active',
                  });
                  setShowTaskModal(true);
                }}
                className="px-4 py-2.5 rounded-xl btn-3d-red text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-red-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Task</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taskList.map(t => (
                <div key={t.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 text-slate-600">
                        {t.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        +{t.reward} Coins
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{t.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                    <div className="mt-3 text-[11px] text-slate-400 font-mono space-y-1">
                      <div>Countdown: {t.countdownDuration || 10}s • Task Timer: {t.timer}s</div>
                      <div>Completed: {t.completionsCount} times</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        t.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingTask(t);
                          setShowTaskModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: VIDEO ADS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Watch & Earn Video Ads</h1>
                <p className="text-xs text-slate-500">Configure sponsored video clips, duration requirements, and rewards</p>
              </div>
              <button
                onClick={() => {
                  setEditingAd({
                    title: '',
                    description: '',
                    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    duration: 30,
                    reward: 50,
                    dailyLimit: 5,
                    status: 'active',
                  });
                  setShowAdModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black text-xs font-black transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Video Ad</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {adList.map(ad => (
                <div key={ad.id} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <img src={ad.thumbnail} alt={ad.title} className="w-full aspect-video rounded-xl object-cover mb-3" />
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-500">Duration: {ad.duration}s</span>
                      <span className="text-xs font-mono font-bold text-amber-400">+{ad.reward} Coins</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{ad.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ad.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400">{ad.viewsCount} views</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingAd(ad);
                          setShowAdModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: WITHDRAWALS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Withdrawal Requests Queue</h1>
              <p className="text-xs text-slate-500">
                Review user payout tickets. Rejecting refunds held balance back to user instantly.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="pb-3">User & ID</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Account Info</th>
                    <th className="pb-3">Coins / Amount</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawalList.map(w => (
                    <tr key={w.id} className="text-slate-600">
                      <td className="py-3">
                        <div className="font-bold text-slate-900">{w.userName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{w.userEmail}</div>
                      </td>
                      <td className="py-3 font-semibold text-slate-900">
                        {w.methodName}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-slate-600 max-w-xs">
                        {Object.entries(w.accountInfo || {}).map(([k, v]) => (
                          <div key={k}>{k}: <span className="text-white font-bold">{v}</span></div>
                        ))}
                      </td>
                      <td className="py-3 font-mono">
                        <div className="font-bold text-emerald-400">{w.currency} {w.finalAmount}</div>
                        <div className="text-[10px] text-amber-400">(-{w.coinsDeducted} Coins)</div>
                      </td>
                      <td className="py-3 text-[11px] text-slate-400 font-mono">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            w.status === 'Paid'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : w.status === 'Approved'
                              ? 'bg-blue-500/15 text-blue-400'
                              : w.status === 'Rejected'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        {w.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateWithdrawal(w.id, 'Approved')}
                              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateWithdrawal(w.id, 'Rejected')}
                              className="px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-[11px] font-bold"
                            >
                              Reject & Refund
                            </button>
                          </>
                        )}
                        {w.status === 'Approved' && (
                          <button
                            onClick={() => handleUpdateWithdrawal(w.id, 'Paid')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: DEDICATED CURRENCY MANAGEMENT (CRITICAL REQUIREMENT) */}
        {/* ======================================================== */}
        {activeTab === 'currencies' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Currency Management</h1>
                <p className="text-xs text-slate-500">
                  Full control over multi-currency rates, symbols, coin conversion values, and withdrawal limits
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingCurrency({
                    code: 'EUR',
                    symbol: '€',
                    name: 'Euro',
                    exchangeRateToUSD: 0.92,
                    coinConversionRate: 1087,
                    minWithdrawal: 5,
                    maxWithdrawal: 1000,
                    withdrawalFeePercent: 1.5,
                    status: 'enabled',
                  });
                  setShowCurrencyModal(true);
                }}
                className="px-4 py-2.5 rounded-xl btn-3d-red text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Currency</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {currencyList.map(c => (
                <div key={c.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-red-600/15 text-red-400 flex items-center justify-center font-mono font-bold text-lg">
                        {c.symbol}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{c.name} ({c.code})</div>
                        <div className="text-[10px] text-slate-500 font-mono">1 USD = {c.exchangeRateToUSD} {c.code}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        c.status === 'enabled' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {c.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs text-[11px] font-mono space-y-1 text-slate-600">
                    <div>1000 Coins Value: <strong className="text-slate-900">{c.symbol}{(c.exchangeRateToUSD).toFixed(2)}</strong></div>
                    <div>Min Withdrawal: <strong className="text-slate-900">{c.symbol}{c.minWithdrawal}</strong></div>
                    <div>Max Withdrawal: <strong className="text-slate-900">{c.symbol}{c.maxWithdrawal}</strong></div>
                    <div>Fee: <strong className="text-amber-400">{c.withdrawalFeePercent}%</strong></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingCurrency(c);
                        setShowCurrencyModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg btn-3d-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCurrency(c.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-2xs text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: PAYMENT METHODS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'paymentMethods' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Withdrawal Gateways & Methods</h1>
                <p className="text-xs text-slate-500">
                  Configure bKash, Nagad, Bank, PayPal, RedotPay, Tonkeeper, or create custom payout methods
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingMethod({
                    name: '',
                    currency: 'USD',
                    minWithdrawal: 10,
                    maxWithdrawal: 1000,
                    withdrawalFee: 1.5,
                    feeType: 'percentage',
                    status: 'enabled',
                    instructions: 'Enter your account details.',
                    requiredFields: [
                      { fieldId: 'accountNumber', label: 'Account / Wallet ID', placeholder: 'Enter ID', type: 'text', required: true }
                    ],
                  });
                  setShowMethodModal(true);
                }}
                className="px-4 py-2.5 rounded-xl btn-3d-red text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Method</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {methodList.map(m => (
                <div key={m.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{m.name}</h3>
                      <div className="text-[10px] text-slate-500 font-mono">Currency: {m.currency}</div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        m.status === 'enabled' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {m.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">{m.instructions}</p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs text-[11px] font-mono space-y-1 text-slate-600">
                    <div>Min: {m.minWithdrawal} • Max: {m.maxWithdrawal}</div>
                    <div>Fee: {m.withdrawalFee} {m.feeType === 'percentage' ? '%' : 'flat'}</div>
                    <div>Required Fields: {m.requiredFields?.length || 0}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingMethod(m);
                        setShowMethodModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg btn-3d-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteMethod(m.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-2xs text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 8: NOTICES & POPUPS */}
        {/* ======================================================== */}
        {activeTab === 'notices' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notices, Popups & Banners</h1>
                <p className="text-xs text-slate-500">Announcements displayed in the user panel</p>
              </div>
              <button
                onClick={() => {
                  setEditingNotice({
                    title: '',
                    message: '',
                    type: 'popup',
                    buttonText: 'Got It',
                    buttonUrl: '#',
                    status: 'active',
                  });
                  setShowNoticeModal(true);
                }}
                className="px-4 py-2.5 rounded-xl btn-3d-red text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Notice</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {noticeList.map(n => (
                <div key={n.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      {n.type}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        n.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {n.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingNotice(n);
                        setShowNoticeModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg btn-3d-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-2xs text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 9: REFERRAL SETTINGS */}
        {/* ======================================================== */}
        {activeTab === 'referrals' && platformSettings && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Referral Network Control</h1>
              <p className="text-xs text-slate-500">Configure fixed invite bonuses and percentage commissions</p>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Fixed Referral Reward (Coins)</label>
                <input
                  type="number"
                  value={platformSettings.fixedReferralCoins || 100}
                  onChange={e => setPlatformSettings({ ...platformSettings, fixedReferralCoins: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Commission Percentage (%)</label>
                <input
                  type="number"
                  value={platformSettings.referralCommissionPercent || 10}
                  onChange={e => setPlatformSettings({ ...platformSettings, referralCommissionPercent: parseFloat(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Minimum Qualifying Completed Tasks</label>
                <input
                  type="number"
                  value={platformSettings.minReferralQualifyingTasks || 1}
                  onChange={e => setPlatformSettings({ ...platformSettings, minReferralQualifyingTasks: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl btn-3d-red text-white text-xs font-bold transition-all shadow-md shadow-red-600/30"
                >
                  Save Referral Configuration
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 10: AUDIT LOGS */}
        {/* ======================================================== */}
        {activeTab === 'auditLogs' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Administrative Audit Logs</h1>
              <p className="text-xs text-slate-500">
                Immutable chronological log of all balance modifications, withdrawal approvals, and reversals
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Admin</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Target User</th>
                    <th className="pb-3">Delta</th>
                    <th className="pb-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="text-slate-600">
                      <td className="py-3 text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 text-red-400 font-bold">{log.adminId}</td>
                      <td className="py-3 font-bold text-slate-900">{log.action}</td>
                      <td className="py-3 text-slate-600">{log.targetUserName || log.targetUserId}</td>
                      <td className="py-3 text-amber-400 font-bold">
                        {log.amountChanged !== 0 ? `${log.amountChanged > 0 ? '+' : ''}${log.amountChanged}` : '-'}
                      </td>
                      <td className="py-3 text-slate-500 max-w-sm truncate">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 11: SETTINGS */}
        {/* ======================================================== */}
        {activeTab === 'settings' && platformSettings && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
              <p className="text-xs text-slate-500">Configure core app parameters and feature toggles</p>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Application Name</label>
                <input
                  type="text"
                  value={platformSettings.appName}
                  onChange={e => setPlatformSettings({ ...platformSettings, appName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Logo Text</label>
                <input
                  type="text"
                  value={platformSettings.logoText}
                  onChange={e => setPlatformSettings({ ...platformSettings, logoText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Mandatory Task Countdown Duration (Seconds)</label>
                <input
                  type="number"
                  value={platformSettings.defaultTaskCountdownSeconds || 10}
                  onChange={e => setPlatformSettings({ ...platformSettings, defaultTaskCountdownSeconds: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.taskSystemEnabled}
                    onChange={e => setPlatformSettings({ ...platformSettings, taskSystemEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600"
                  />
                  <span className="text-xs font-medium text-slate-600">Task System Active</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.videoSystemEnabled}
                    onChange={e => setPlatformSettings({ ...platformSettings, videoSystemEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600"
                  />
                  <span className="text-xs font-medium text-slate-600">Watch & Earn Video System Active</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.referralSystemEnabled}
                    onChange={e => setPlatformSettings({ ...platformSettings, referralSystemEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600"
                  />
                  <span className="text-xs font-medium text-slate-600">Referral Commissions Active</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl btn-3d-red text-white text-xs font-bold transition-all shadow-md shadow-red-600/30"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: MANUAL BALANCE ADJUSTMENT (WITH AUDIT LOGGING) */}
      {/* ======================================================== */}
      {showBalanceModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Manual Balance Adjustment</h3>
            <p className="text-xs text-slate-500">
              User: <span className="text-white font-bold">{selectedUser.name}</span> ({selectedUser.id})
              <br />
              Current Balance: <span className="text-amber-400 font-mono font-bold">{selectedUser.coins.toLocaleString()} Coins</span>
            </p>

            <form onSubmit={handleBalanceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceAction('add')}
                  className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                    balanceAction === 'add' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  + Add Coins
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceAction('remove')}
                  className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                    balanceAction === 'remove' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  - Remove Coins
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Coin Amount</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Mandatory Reason for Audit Log
                </label>
                <textarea
                  required
                  rows={3}
                  value={balanceReason}
                  onChange={e => setBalanceReason(e.target.value)}
                  placeholder="e.g. Promotional creator grant, bonus correction, dispute resolution"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-3d-red text-white text-xs font-bold shadow-md shadow-red-600/30"
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: WITHDRAWAL REJECTION & AUTOMATIC REFUND */}
      {/* ======================================================== */}
      {rejectingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Reject Withdrawal & Refund Balance</span>
            </h3>
            <p className="text-xs text-slate-600">
              This action will return <strong className="text-amber-400">{rejectingWithdrawal.coinsDeducted} Coins</strong> immediately back to <strong className="text-slate-900">{rejectingWithdrawal.userName}</strong> and log an administrative audit record.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Rejection Reason</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Invalid account number, account unverified, name mismatch"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingWithdrawal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-5 py-2 rounded-xl btn-3d-red text-white text-xs font-bold"
              >
                Confirm Rejection & Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TASK FORM */}
      {/* ======================================================== */}
      {showTaskModal && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 my-8">
            <h3 className="text-base font-bold text-slate-900">
              {editingTask.id ? 'Edit Earning Task' : 'Create New Earning Task'}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Task Title</label>
                <input
                  type="text"
                  required
                  value={editingTask.name || ''}
                  onChange={e => setEditingTask({ ...editingTask, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Category</label>
                  <select
                    value={editingTask.category || 'Website Visit'}
                    onChange={e => setEditingTask({ ...editingTask, category: e.target.value as TaskCategory })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  >
                    <option value="Website Visit">Website Visit</option>
                    <option value="Social Follow">Social Follow</option>
                    <option value="Social Like">Social Like</option>
                    <option value="Video Watch">Video Watch</option>
                    <option value="App Install">App Install</option>
                    <option value="Custom Task">Custom Task</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Reward (Coins)</label>
                  <input
                    type="number"
                    required
                    value={editingTask.reward || 50}
                    onChange={e => setEditingTask({ ...editingTask, reward: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Mandatory Start Countdown (Seconds)</label>
                  <input
                    type="number"
                    required
                    value={editingTask.countdownDuration || 10}
                    onChange={e => setEditingTask({ ...editingTask, countdownDuration: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Task Active Timer (Seconds)</label>
                  <input
                    type="number"
                    required
                    value={editingTask.timer || 30}
                    onChange={e => setEditingTask({ ...editingTask, timer: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Target URL</label>
                <input
                  type="url"
                  required
                  value={editingTask.url || ''}
                  onChange={e => setEditingTask({ ...editingTask, url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Description</label>
                <textarea
                  rows={2}
                  value={editingTask.description || ''}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Instructions for Users</label>
                <textarea
                  rows={2}
                  value={editingTask.instructions || ''}
                  onChange={e => setEditingTask({ ...editingTask, instructions: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-3d-red text-white text-xs font-bold shadow-md shadow-red-600/30"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CURRENCY FORM */}
      {/* ======================================================== */}
      {showCurrencyModal && editingCurrency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingCurrency.id ? 'Edit Currency Configuration' : 'Add New Currency'}
            </h3>

            <form onSubmit={handleSaveCurrency} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Code (e.g. USD, BDT, INR)</label>
                  <input
                    type="text"
                    required
                    value={editingCurrency.code || ''}
                    onChange={e => setEditingCurrency({ ...editingCurrency, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Symbol ($, ৳, ₹, €)</label>
                  <input
                    type="text"
                    required
                    value={editingCurrency.symbol || ''}
                    onChange={e => setEditingCurrency({ ...editingCurrency, symbol: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Full Currency Name</label>
                <input
                  type="text"
                  required
                  value={editingCurrency.name || ''}
                  onChange={e => setEditingCurrency({ ...editingCurrency, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Exchange Rate To 1 USD</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={editingCurrency.exchangeRateToUSD || 1.0}
                    onChange={e => setEditingCurrency({ ...editingCurrency, exchangeRateToUSD: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Withdrawal Fee (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingCurrency.withdrawalFeePercent || 1.5}
                    onChange={e => setEditingCurrency({ ...editingCurrency, withdrawalFeePercent: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Min Withdrawal</label>
                  <input
                    type="number"
                    required
                    value={editingCurrency.minWithdrawal || 5}
                    onChange={e => setEditingCurrency({ ...editingCurrency, minWithdrawal: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Max Withdrawal</label>
                  <input
                    type="number"
                    required
                    value={editingCurrency.maxWithdrawal || 1000}
                    onChange={e => setEditingCurrency({ ...editingCurrency, maxWithdrawal: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCurrencyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-3d-red text-white text-xs font-bold shadow-md shadow-red-600/30"
                >
                  Save Currency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PAYMENT METHOD FORM */}
      {/* ======================================================== */}
      {showMethodModal && editingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingMethod.id ? 'Edit Gateway Method' : 'Add Custom Gateway Method'}
            </h3>

            <form onSubmit={handleSaveMethod} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Gateway Name</label>
                <input
                  type="text"
                  required
                  value={editingMethod.name || ''}
                  onChange={e => setEditingMethod({ ...editingMethod, name: e.target.value })}
                  placeholder="e.g. bKash, PayPal, Wire Transfer"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Currency Code</label>
                  <input
                    type="text"
                    required
                    value={editingMethod.currency || 'USD'}
                    onChange={e => setEditingMethod({ ...editingMethod, currency: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Fee</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingMethod.withdrawalFee || 1.5}
                    onChange={e => setEditingMethod({ ...editingMethod, withdrawalFee: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Instructions For Earner</label>
                <textarea
                  rows={2}
                  value={editingMethod.instructions || ''}
                  onChange={e => setEditingMethod({ ...editingMethod, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMethodModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-3d-red text-white text-xs font-bold shadow-md shadow-red-600/30"
                >
                  Save Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOTICE FORM */}
      {/* ======================================================== */}
      {showNoticeModal && editingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Configure Notice / Announcement</h3>

            <form onSubmit={handleSaveNotice} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Title</label>
                <input
                  type="text"
                  required
                  value={editingNotice.title || ''}
                  onChange={e => setEditingNotice({ ...editingNotice, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Message Body</label>
                <textarea
                  rows={3}
                  required
                  value={editingNotice.message || ''}
                  onChange={e => setEditingNotice({ ...editingNotice, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-3d-red text-white text-xs font-bold shadow-md shadow-red-600/30"
                >
                  Save Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIDEO AD FORM */}
      {/* ======================================================== */}
      {showAdModal && editingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Video Advertisement Setup</h3>

            <form onSubmit={handleSaveAd} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Video Title</label>
                <input
                  type="text"
                  required
                  value={editingAd.title || ''}
                  onChange={e => setEditingAd({ ...editingAd, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Duration (Seconds)</label>
                  <input
                    type="number"
                    required
                    value={editingAd.duration || 30}
                    onChange={e => setEditingAd({ ...editingAd, duration: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Reward (Coins)</label>
                  <input
                    type="number"
                    required
                    value={editingAd.reward || 50}
                    onChange={e => setEditingAd({ ...editingAd, reward: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Thumbnail URL</label>
                <input
                  type="url"
                  required
                  value={editingAd.thumbnail || ''}
                  onChange={e => setEditingAd({ ...editingAd, thumbnail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Video MP4 URL</label>
                <input
                  type="url"
                  required
                  value={editingAd.videoUrl || ''}
                  onChange={e => setEditingAd({ ...editingAd, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black text-xs font-black shadow-md shadow-amber-600/30"
                >
                  Save Video Ad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
