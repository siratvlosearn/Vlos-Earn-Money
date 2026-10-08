import {
  User,
  Task,
  VideoAd,
  Currency,
  WithdrawalMethod,
  WithdrawalRequest,
  Transaction,
  Notice,
  AdminAuditLog,
  PlatformSettings
} from '../types';

const ADMIN_TOKEN_KEY = 'vlos_admin_token';

export const api = {
  // Auth & User
  async getCurrentUser(userId?: string): Promise<{ user: User }> {
    const res = await fetch(`/api/auth/me${userId ? `?userId=${userId}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async loginUser(data: { loginId?: string; email?: string; password?: string; name?: string; referralCode?: string }): Promise<{ user: User }> {
    const res = await fetch('/api/auth/user-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to login');
    return result;
  },

  async signupUser(data: { name: string; email: string; password?: string; referralCode?: string }): Promise<{ user: User }> {
    const res = await fetch('/api/auth/user-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to register account');
    return result;
  },

  async updateProfile(data: { userId: string; name?: string; phone?: string; profilePhoto?: string; currency?: string }): Promise<{ user: User }> {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update profile');
    return result;
  },

  // Platform & Settings
  async getPlatformData(): Promise<{
    settings: PlatformSettings;
    activeNotices: Notice[];
    currencies: Currency[];
    paymentMethods: WithdrawalMethod[];
  }> {
    const res = await fetch('/api/platform/settings');
    if (!res.ok) throw new Error('Failed to load platform data');
    return res.json();
  },

  async getCurrencies(): Promise<{ currencies: Currency[] }> {
    const res = await fetch('/api/currencies');
    return res.json();
  },

  async getPaymentMethods(): Promise<{ paymentMethods: WithdrawalMethod[] }> {
    const res = await fetch('/api/payment-methods');
    return res.json();
  },

  // Tasks
  async getTasks(userId?: string): Promise<{ tasks: (Task & { isCompletedByUser?: boolean })[] }> {
    const res = await fetch(`/api/tasks${userId ? `?userId=${userId}` : ''}`);
    return res.json();
  },

  async startTask(taskId: string, userId: string): Promise<{
    challengeToken: string;
    countdownDuration: number;
    taskDuration: number;
    message: string;
  }> {
    const res = await fetch('/api/tasks/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, userId }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to initiate task');
    return result;
  },

  async completeTask(challengeToken: string): Promise<{
    reward: number;
    userCoins: number;
    message: string;
  }> {
    const res = await fetch('/api/tasks/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeToken }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to complete task');
    return result;
  },

  // Video Ads
  async getAds(): Promise<{ ads: VideoAd[] }> {
    const res = await fetch('/api/ads');
    return res.json();
  },

  async startAd(adId: string, userId: string): Promise<{ challengeToken: string; duration: number }> {
    const res = await fetch('/api/ads/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId, userId }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to start video ad');
    return result;
  },

  async completeAd(challengeToken: string): Promise<{ reward: number; userCoins: number; message: string }> {
    const res = await fetch('/api/ads/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeToken }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to verify video completion');
    return result;
  },

  // Withdrawals
  async createWithdrawal(data: {
    userId: string;
    methodId: string;
    amountCoins: number;
    accountInfo: Record<string, string>;
    currencyCode: string;
  }): Promise<{ withdrawal: WithdrawalRequest; remainingCoins: number; message: string }> {
    const res = await fetch('/api/withdrawals/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Withdrawal request failed');
    return result;
  },

  async getMyWithdrawals(userId: string): Promise<{ withdrawals: WithdrawalRequest[] }> {
    const res = await fetch(`/api/withdrawals/my?userId=${userId}`);
    return res.json();
  },

  // Transactions
  async getTransactions(userId?: string): Promise<{ transactions: Transaction[] }> {
    const res = await fetch(`/api/transactions${userId ? `?userId=${userId}` : ''}`);
    return res.json();
  },

  // Referrals
  async getReferrals(userId: string): Promise<{
    referrals: any[];
    totalReferrals: number;
    activeReferrals: number;
    referralEarnings: number;
    referralCode: string;
    settings: { fixedCoins: number; commissionPercent: number };
  }> {
    const res = await fetch(`/api/referrals?userId=${userId}`);
    return res.json();
  },

  // ------------------------------------
  // ADMIN AUTH & APIS
  // ------------------------------------
  getAdminToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  setAdminToken(token: string) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },

  removeAdminToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  getAdminHeaders(): HeadersInit {
    const token = this.getAdminToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    };
  },

  async adminLogin(username: string, password: string): Promise<{ token: string; admin: any }> {
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Admin authentication failed');
    this.setAdminToken(result.token);
    return result;
  },

  async adminVerify(): Promise<boolean> {
    const token = this.getAdminToken();
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/admin-verify', {
        headers: this.getAdminHeaders(),
      });
      const data = await res.json();
      return !!data.authenticated;
    } catch {
      return false;
    }
  },

  async adminGetStats(): Promise<any> {
    const res = await fetch('/api/admin/stats', { headers: this.getAdminHeaders() });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  async adminGetUsers(q?: string, status?: string): Promise<{ users: User[] }> {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    const res = await fetch(`/api/admin/users?${params.toString()}`, { headers: this.getAdminHeaders() });
    return res.json();
  },

  async adminGetUserDetails(userId: string): Promise<any> {
    const res = await fetch(`/api/admin/users/${userId}`, { headers: this.getAdminHeaders() });
    return res.json();
  },

  async adminUpdateUserBalance(userId: string, data: { amount: number; action: 'add' | 'remove'; reason: string }): Promise<any> {
    const res = await fetch(`/api/admin/users/${userId}/balance`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to adjust balance');
    return result;
  },

  async adminUpdateUserStatus(userId: string, data: { status: 'active' | 'suspended'; reason?: string }): Promise<any> {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async adminSaveTask(task: Partial<Task>): Promise<any> {
    const isEdit = !!task.id;
    const url = isEdit ? `/api/admin/tasks/${task.id}` : '/api/admin/tasks';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getAdminHeaders(),
      body: JSON.stringify(task),
    });
    return res.json();
  },

  async adminDeleteTask(taskId: string): Promise<any> {
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: 'DELETE',
      headers: this.getAdminHeaders(),
    });
    return res.json();
  },

  async adminSaveAd(ad: Partial<VideoAd>): Promise<any> {
    const isEdit = !!ad.id;
    const url = isEdit ? `/api/admin/ads/${ad.id}` : '/api/admin/ads';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getAdminHeaders(),
      body: JSON.stringify(ad),
    });
    return res.json();
  },

  async adminDeleteAd(adId: string): Promise<any> {
    const res = await fetch(`/api/admin/ads/${adId}`, {
      method: 'DELETE',
      headers: this.getAdminHeaders(),
    });
    return res.json();
  },

  async adminGetWithdrawals(status?: string): Promise<{ withdrawals: WithdrawalRequest[] }> {
    const url = `/api/admin/withdrawals${status ? `?status=${status}` : ''}`;
    const res = await fetch(url, { headers: this.getAdminHeaders() });
    return res.json();
  },

  async adminUpdateWithdrawalStatus(
    id: string,
    data: { status: 'Approved' | 'Rejected' | 'Paid'; rejectionReason?: string; adminNotes?: string }
  ): Promise<any> {
    const res = await fetch(`/api/admin/withdrawals/${id}/status`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update withdrawal');
    return result;
  },

  // Currency CRUD
  async adminGetCurrencies(): Promise<{ currencies: Currency[] }> {
    const res = await fetch('/api/admin/currencies', { headers: this.getAdminHeaders() });
    return res.json();
  },

  async adminSaveCurrency(currency: Partial<Currency>): Promise<any> {
    const isEdit = !!currency.id;
    const url = isEdit ? `/api/admin/currencies/${currency.id}` : '/api/admin/currencies';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getAdminHeaders(),
      body: JSON.stringify(currency),
    });
    return res.json();
  },

  async adminDeleteCurrency(currencyId: string): Promise<any> {
    const res = await fetch(`/api/admin/currencies/${currencyId}`, {
      method: 'DELETE',
      headers: this.getAdminHeaders(),
    });
    return res.json();
  },

  // Payment Methods CRUD
  async adminGetPaymentMethods(): Promise<{ paymentMethods: WithdrawalMethod[] }> {
    const res = await fetch('/api/admin/payment-methods', { headers: this.getAdminHeaders() });
    return res.json();
  },

  async adminSavePaymentMethod(methodData: Partial<WithdrawalMethod>): Promise<any> {
    const isEdit = !!methodData.id;
    const url = isEdit ? `/api/admin/payment-methods/${methodData.id}` : '/api/admin/payment-methods';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getAdminHeaders(),
      body: JSON.stringify(methodData),
    });
    return res.json();
  },

  async adminDeletePaymentMethod(methodId: string): Promise<any> {
    const res = await fetch(`/api/admin/payment-methods/${methodId}`, {
      method: 'DELETE',
      headers: this.getAdminHeaders(),
    });
    return res.json();
  },

  // Notices
  async adminGetNotices(): Promise<{ notices: Notice[] }> {
    const res = await fetch('/api/admin/notices', { headers: this.getAdminHeaders() });
    return res.json();
  },

  async adminSaveNotice(notice: Partial<Notice>): Promise<any> {
    const isEdit = !!notice.id;
    const url = isEdit ? `/api/admin/notices/${notice.id}` : '/api/admin/notices';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getAdminHeaders(),
      body: JSON.stringify(notice),
    });
    return res.json();
  },

  async adminDeleteNotice(noticeId: string): Promise<any> {
    const res = await fetch(`/api/admin/notices/${noticeId}`, {
      method: 'DELETE',
      headers: this.getAdminHeaders(),
    });
    return res.json();
  },

  // Settings & Audit Logs
  async adminGetSettings(): Promise<{ settings: PlatformSettings }> {
    const res = await fetch('/api/admin/settings', { headers: this.getAdminHeaders() });
    return res.json();
  },

  async adminUpdateSettings(settings: Partial<PlatformSettings>): Promise<any> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async adminGetAuditLogs(): Promise<{ auditLogs: AdminAuditLog[] }> {
    const res = await fetch('/api/admin/audit-logs', { headers: this.getAdminHeaders() });
    return res.json();
  },
};
