import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer } from './components/common/ToastContainer';
import { NoticeModal } from './components/common/NoticeModal';
import { UserModal } from './components/common/UserModal';
import { AuthGateway } from './components/auth/AuthGateway';

// User Views
import { UserDashboard } from './components/user/UserDashboard';
import { TasksView } from './components/user/TasksView';
import { WatchEarnView } from './components/user/WatchEarnView';
import { ReferralView } from './components/user/ReferralView';
import { WalletView } from './components/user/WalletView';
import { ProfileView } from './components/user/ProfileView';
import { TransactionsView } from './components/user/TransactionsView';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { Transaction } from './types';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { currentPanel, setCurrentPanel, isAdmin, user, activeNotices } = useApp();
  const [userTab, setUserTab] = useState<string>('dashboard');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);

  // Auto-prompt initial notice popup if available
  useEffect(() => {
    if (activeNotices.length > 0 && !sessionStorage.getItem('vlos_notice_shown')) {
      setShowNoticeModal(true);
      sessionStorage.setItem('vlos_notice_shown', 'true');
    }
  }, [activeNotices]);

  // Load recent transactions for home dashboard
  useEffect(() => {
    if (user?.id) {
      api.getTransactions(user.id)
        .then(res => setRecentTransactions(res.transactions || []))
        .catch(console.error);
    }
  }, [user?.id, user?.coins]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      <ToastContainer />

      {/* Global Modals */}
      {showNoticeModal && <NoticeModal onClose={() => setShowNoticeModal(false)} />}
      {showUserModal && <UserModal onClose={() => setShowUserModal(false)} />}

      {/* ADMIN PANEL */}
      {currentPanel === 'admin' ? (
        !isAdmin ? (
          <AdminLoginModal
            onSuccess={() => {}}
            onCancel={() => setCurrentPanel('user')}
          />
        ) : (
          <AdminDashboard />
        )
      ) : !user ? (
        /* USER AUTHENTICATION GATEWAY */
        <AuthGateway onAdminClick={() => setCurrentPanel('admin')} />
      ) : (
        /* USER PANEL */
        <div className="flex-1 flex flex-col">
          <Header
            onOpenUserModal={() => setShowUserModal(true)}
            onOpenNoticeModal={() => setShowNoticeModal(true)}
          />

          {/* Desktop Sub Navigation (3D Light Tactile Bar) */}
          <div className="hidden md:block bg-white/80 backdrop-blur-md border-b border-slate-200/90 sticky top-16 z-30 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.03)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 h-13">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'tasks', label: 'Earning Tasks' },
                { id: 'watch', label: 'Watch & Earn' },
                { id: 'referral', label: 'Referral Program' },
                { id: 'wallet', label: 'Wallet & Payouts' },
                { id: 'transactions', label: 'Transactions' },
                { id: 'profile', label: 'My Profile' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setUserTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    userTab === tab.id
                      ? 'btn-3d-red text-white font-bold shadow-sm shadow-red-600/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:translate-y-0.5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Tab Content */}
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
            {userTab === 'dashboard' && (
              <UserDashboard
                onNavigate={setUserTab}
                recentTransactions={recentTransactions}
                onOpenNoticeModal={() => setShowNoticeModal(true)}
              />
            )}
            {userTab === 'tasks' && <TasksView />}
            {userTab === 'watch' && <WatchEarnView />}
            {userTab === 'referral' && <ReferralView />}
            {userTab === 'wallet' && <WalletView />}
            {userTab === 'transactions' && <TransactionsView />}
            {userTab === 'profile' && <ProfileView />}
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav activeTab={userTab} setActiveTab={setUserTab} />
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
