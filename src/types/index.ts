export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto: string;
  coins: number;
  balanceUsd: number;
  todayEarnings: number;
  totalEarnings: number;
  referralEarnings: number;
  completedTasksCount: number;
  availableWithdrawalBalance: number;
  pendingWithdrawal: number;
  referralCode: string;
  referredBy: string | null;
  totalReferrals: number;
  activeReferrals: number;
  status: UserStatus;
  currency: string;
  createdAt: string;
}

export type TaskCategory =
  | 'Website Visit'
  | 'Social Follow'
  | 'Social Like'
  | 'Video Watch'
  | 'App Install'
  | 'Custom Task';

export interface Task {
  id: string;
  name: string;
  description: string;
  category: TaskCategory;
  url: string;
  reward: number; // in Coins
  rewardCurrency: string; // e.g. "Coins"
  timer: number; // Seconds to spend on task after countdown
  countdownDuration: number; // Mandatory start countdown (default 10s)
  dailyLimit: number;
  totalLimit: number;
  completionsCount: number;
  instructions: string;
  status: 'active' | 'disabled';
  startDate: string;
  endDate: string;
  isCompletedByUser?: boolean;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  taskName: string;
  userId: string;
  reward: number;
  completedAt: string;
}

export interface VideoAd {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number; // seconds
  reward: number; // in Coins
  rewardCurrency: string;
  dailyLimit: number;
  viewsCount: number;
  status: 'active' | 'disabled';
}

export interface AdCompletion {
  id: string;
  adId: string;
  adTitle: string;
  userId: string;
  reward: number;
  completedAt: string;
}

export interface Currency {
  id: string;
  code: string; // USD, BDT, INR, EUR, GBP, RUB, TON
  symbol: string; // $, ৳, ₹, €, £, ₽, TON
  name: string;
  exchangeRateToUSD: number; // e.g. 1 USD = 120 BDT
  coinConversionRate: number; // e.g. 1000 Coins = 1 USD (in this currency: 1000 Coins = 120 BDT)
  minWithdrawal: number;
  maxWithdrawal: number;
  withdrawalFeePercent: number;
  status: 'enabled' | 'disabled';
}

export interface WithdrawalField {
  fieldId: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'email';
  required: boolean;
}

export interface WithdrawalMethod {
  id: string;
  name: string; // bKash, Nagad, Bank Transfer, PayPal, RedotPay, Tonkeeper
  icon: string;
  currency: string; // Can be linked to specific currency or 'ANY'
  minWithdrawal: number;
  maxWithdrawal: number;
  withdrawalFee: number; // Fee in percentage or flat
  feeType: 'flat' | 'percentage';
  requiredFields: WithdrawalField[];
  status: 'enabled' | 'disabled';
  instructions: string;
}

export type WithdrawalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Paid';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  methodId: string;
  methodName: string;
  accountInfo: Record<string, string>;
  currency: string;
  coinsDeducted: number;
  amount: number;
  fee: number;
  finalAmount: number;
  status: WithdrawalStatus;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'Task Reward'
  | 'Video Reward'
  | 'Referral Reward'
  | 'Bonus'
  | 'Withdrawal'
  | 'Withdrawal Refund'
  | 'Admin Adjustment';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // Coins (positive for credit, negative for debit)
  currency: string;
  status: 'Completed' | 'Pending' | 'Reversed';
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  bonusCoins: number;
  status: 'active' | 'qualified';
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  type: 'popup' | 'announcement' | 'banner';
  image?: string;
  buttonText?: string;
  buttonUrl?: string;
  status: 'active' | 'disabled';
  startDate: string;
  endDate: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  targetUserId: string;
  targetUserName: string;
  action: string;
  previousBalance: number;
  newBalance: number;
  amountChanged: number;
  reason: string;
  createdAt: string;
}

export interface PlatformSettings {
  appName: string;
  logoText: string;
  appDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  taskSystemEnabled: boolean;
  videoSystemEnabled: boolean;
  referralSystemEnabled: boolean;
  fixedReferralCoins: number;
  referralCommissionPercent: number;
  minReferralQualifyingTasks: number;
  maxReferralCommission: number;
  coinToUsdRate: number; // e.g. 1000 Coins = 1 USD
  defaultTaskCountdownSeconds: number; // Default 10 seconds
}

export interface AdminUser {
  username: string;
  role: 'superadmin' | 'admin';
  lastLogin: string;
}
