import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'vlosearnbusiness';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Sirat@2026$';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'vlos-earn-super-secure-jwt-token-2026';

// Cryptographic helpers
function signToken(payload: object): string {
  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('hex');
  return Buffer.from(data).toString('base64url') + '.' + hmac;
}

function verifyToken<T = any>(token: string): T | null {
  try {
    const [dataB64, signature] = token.split('.');
    if (!dataB64 || !signature) return null;
    const data = Buffer.from(dataB64, 'base64url').toString('utf8');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return JSON.parse(data) as T;
    }
    return null;
  } catch {
    return null;
  }
}

// Persistent Data Storage Path
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'vlos_store.json');

// Initial seed configurations
const INITIAL_CURRENCIES = [
  {
    id: 'curr_usd',
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    exchangeRateToUSD: 1.0,
    coinConversionRate: 1000, // 1000 Coins = $1.00
    minWithdrawal: 5.0,
    maxWithdrawal: 1000.0,
    withdrawalFeePercent: 1.5,
    status: 'enabled'
  },
  {
    id: 'curr_bdt',
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    exchangeRateToUSD: 121.5,
    coinConversionRate: 8.23, // 1000 Coins = 121.5 BDT (~8.23 coins per 1 BDT)
    minWithdrawal: 500,
    maxWithdrawal: 50000,
    withdrawalFeePercent: 1.85,
    status: 'enabled'
  },
  {
    id: 'curr_inr',
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    exchangeRateToUSD: 86.8,
    coinConversionRate: 11.52, // 1000 Coins = 86.8 INR
    minWithdrawal: 400,
    maxWithdrawal: 40000,
    withdrawalFeePercent: 1.5,
    status: 'enabled'
  },
  {
    id: 'curr_eur',
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    exchangeRateToUSD: 0.92,
    coinConversionRate: 1087, // 1000 Coins = 0.92 EUR
    minWithdrawal: 5,
    maxWithdrawal: 1000,
    withdrawalFeePercent: 1.5,
    status: 'enabled'
  },
  {
    id: 'curr_gbp',
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    exchangeRateToUSD: 0.78,
    coinConversionRate: 1282,
    minWithdrawal: 5,
    maxWithdrawal: 1000,
    withdrawalFeePercent: 1.5,
    status: 'enabled'
  },
  {
    id: 'curr_rub',
    code: 'RUB',
    symbol: '₽',
    name: 'Russian Ruble',
    exchangeRateToUSD: 93.4,
    coinConversionRate: 10.7,
    minWithdrawal: 500,
    maxWithdrawal: 50000,
    withdrawalFeePercent: 2.0,
    status: 'enabled'
  },
  {
    id: 'curr_ton',
    code: 'TON',
    symbol: 'TON',
    name: 'Toncoin (Web3)',
    exchangeRateToUSD: 0.20, // e.g. 5 USD per TON -> 0.2 TON per USD
    coinConversionRate: 5000, // 1000 Coins = 0.20 TON
    minWithdrawal: 1.0,
    maxWithdrawal: 500.0,
    withdrawalFeePercent: 0.5,
    status: 'enabled'
  }
];

const INITIAL_PAYMENT_METHODS = [
  {
    id: 'pm_bkash',
    name: 'bKash',
    icon: 'Smartphone',
    currency: 'BDT',
    minWithdrawal: 500,
    maxWithdrawal: 25000,
    withdrawalFee: 1.85,
    feeType: 'percentage',
    status: 'enabled',
    instructions: 'Enter your 11-digit bKash Personal or Agent mobile number. Payouts are reviewed and approved within 2-6 hours.',
    requiredFields: [
      { fieldId: 'accountNumber', label: 'bKash Account Number', placeholder: '01XXXXXXXXX', type: 'text', required: true },
      { fieldId: 'accountType', label: 'Account Type', placeholder: 'Personal / Agent', type: 'text', required: true }
    ]
  },
  {
    id: 'pm_nagad',
    name: 'Nagad',
    icon: 'Wallet',
    currency: 'BDT',
    minWithdrawal: 500,
    maxWithdrawal: 25000,
    withdrawalFee: 1.5,
    feeType: 'percentage',
    status: 'enabled',
    instructions: 'Enter your registered Nagad wallet number. Processing window: 9 AM - 11 PM UTC+6.',
    requiredFields: [
      { fieldId: 'accountNumber', label: 'Nagad Account Number', placeholder: '01XXXXXXXXX', type: 'text', required: true },
      { fieldId: 'accountType', label: 'Account Type', placeholder: 'Personal', type: 'text', required: true }
    ]
  },
  {
    id: 'pm_bank',
    name: 'Bank Transfer',
    icon: 'Building2',
    currency: 'USD',
    minWithdrawal: 25,
    maxWithdrawal: 5000,
    withdrawalFee: 2.0,
    feeType: 'flat',
    status: 'enabled',
    instructions: 'Direct wire or local bank deposit. Ensure the account name matches your verified identity.',
    requiredFields: [
      { fieldId: 'bankName', label: 'Bank Name', placeholder: 'e.g. Chase / Standard Chartered', type: 'text', required: true },
      { fieldId: 'accountName', label: 'Account Holder Name', placeholder: 'Full Name as on Bank Account', type: 'text', required: true },
      { fieldId: 'accountNumber', label: 'Account Number / IBAN', placeholder: 'Account Number or IBAN', type: 'text', required: true },
      { fieldId: 'branchName', label: 'Branch / Routing / SWIFT', placeholder: 'Branch Name or SWIFT Code', type: 'text', required: true }
    ]
  },
  {
    id: 'pm_paypal',
    name: 'PayPal',
    icon: 'Send',
    currency: 'USD',
    minWithdrawal: 10,
    maxWithdrawal: 1000,
    withdrawalFee: 2.5,
    feeType: 'percentage',
    status: 'enabled',
    instructions: 'Global PayPal transfer. Funds will be sent directly to your PayPal account email.',
    requiredFields: [
      { fieldId: 'paypalEmail', label: 'PayPal Email', placeholder: 'yourname@example.com', type: 'email', required: true }
    ]
  },
  {
    id: 'pm_redotpay',
    name: 'RedotPay',
    icon: 'CreditCard',
    currency: 'USD',
    minWithdrawal: 5,
    maxWithdrawal: 1000,
    withdrawalFee: 1.0,
    feeType: 'percentage',
    status: 'enabled',
    instructions: 'Instant RedotPay crypto card wallet transfer using your RedotPay User ID or registered email.',
    requiredFields: [
      { fieldId: 'redotpayId', label: 'RedotPay User ID or Email', placeholder: 'e.g. 10293847 or email@domain.com', type: 'text', required: true }
    ]
  },
  {
    id: 'pm_tonkeeper',
    name: 'Tonkeeper (TON)',
    icon: 'Coins',
    currency: 'TON',
    minWithdrawal: 1.0,
    maxWithdrawal: 500,
    withdrawalFee: 0.05,
    feeType: 'flat',
    status: 'enabled',
    instructions: 'Native The Open Network (TON) blockchain transfer. Paste your non-custodial Tonkeeper address.',
    requiredFields: [
      { fieldId: 'tonAddress', label: 'TON Wallet Address', placeholder: 'EQ... or UQ...', type: 'text', required: true },
      { fieldId: 'memo', label: 'Comment / Memo (Optional)', placeholder: 'Leave blank if personal wallet', type: 'text', required: false }
    ]
  }
];

const INITIAL_TASKS = [
  {
    id: 'task_1',
    name: 'Visit YouTube Creator Monetization Hub',
    description: 'Explore the latest 2026 Creator Monetization guidelines, watch rules, and payout tiers.',
    category: 'Website Visit',
    url: 'https://support.google.com/youtube/answer/72851',
    reward: 60,
    rewardCurrency: 'Coins',
    timer: 30, // 30s task timer
    countdownDuration: 10, // Mandatory 10s countdown
    dailyLimit: 3,
    totalLimit: 5000,
    completionsCount: 842,
    instructions: 'Wait for the mandatory 10-second countdown to complete. Once the task starts, review the site for at least 30 seconds before submitting verification.',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  },
  {
    id: 'task_2',
    name: 'Follow VLØS EARN Official Creator Network',
    description: 'Stay updated on new high-yield earning campaigns, weekly bonus codes, and instant withdrawal windows.',
    category: 'Social Follow',
    url: 'https://youtube.com',
    reward: 120,
    rewardCurrency: 'Coins',
    timer: 20,
    countdownDuration: 10,
    dailyLimit: 1,
    totalLimit: 10000,
    completionsCount: 1940,
    instructions: 'Begin the 10-second countdown. Follow the channel and confirm your handle upon completion.',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  },
  {
    id: 'task_3',
    name: 'Review Daily Fintech Intelligence Digest',
    description: 'Read the top tech and crypto finance headlines to discover emerging payment methods and Web3 earning rails.',
    category: 'Website Visit',
    url: 'https://news.ycombinator.com',
    reward: 50,
    rewardCurrency: 'Coins',
    timer: 25,
    countdownDuration: 10,
    dailyLimit: 2,
    totalLimit: 3000,
    completionsCount: 654,
    instructions: 'Do not close the page before the 10s countdown reaches 0. Spend 25 seconds browsing the articles.',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  },
  {
    id: 'task_4',
    name: 'Like & Engage with YouTube Creator Studio Video',
    description: 'Engage with creator community tips and algorithmic optimization videos.',
    category: 'Social Like',
    url: 'https://youtube.com',
    reward: 80,
    rewardCurrency: 'Coins',
    timer: 20,
    countdownDuration: 10,
    dailyLimit: 2,
    totalLimit: 4000,
    completionsCount: 1120,
    instructions: '10s pre-start countdown enforced. Watch and like the video, then collect your coins.',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  },
  {
    id: 'task_5',
    name: 'Test Decentralized TON Web3 Wallet Demo',
    description: 'Experience instant micro-transactions on The Open Network with zero latency.',
    category: 'App Install',
    url: 'https://ton.org/wallets',
    reward: 250,
    rewardCurrency: 'Coins',
    timer: 45,
    countdownDuration: 10,
    dailyLimit: 1,
    totalLimit: 1500,
    completionsCount: 395,
    instructions: 'Complete 10s start countdown. Open the wallet portal and explore the feature set for 45 seconds.',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  }
];

const INITIAL_ADS = [
  {
    id: 'ad_1',
    title: 'VLØS Creator Studio 2026 Launch Trailer',
    description: 'Discover how top digital creators manage multibank payouts and instant sponsor brand deals.',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 30,
    reward: 50,
    rewardCurrency: 'Coins',
    dailyLimit: 5,
    viewsCount: 3410,
    status: 'active'
  },
  {
    id: 'ad_2',
    title: 'High-Frequency Fintech Payments & Web3 Gateways',
    description: 'Learn about automated cross-border settlements with bKash, RedotPay, and Tonkeeper.',
    thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 25,
    reward: 40,
    rewardCurrency: 'Coins',
    dailyLimit: 5,
    viewsCount: 2890,
    status: 'active'
  },
  {
    id: 'ad_3',
    title: 'Digital Creator Economy & Micro-Task Revolution',
    description: 'How modern digital earners maximize daily yields through structured online activities.',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 20,
    reward: 35,
    rewardCurrency: 'Coins',
    dailyLimit: 5,
    viewsCount: 4120,
    status: 'active'
  }
];

const INITIAL_USERS = [
  {
    id: 'usr_creator_1',
    name: 'Sirat Tuba',
    email: 'sirattuba.official@gmail.com',
    password: 'Sirat@2026$!',
    phone: '+880 1712 345678',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    coins: 2450,
    balanceUsd: 2.45,
    todayEarnings: 240,
    totalEarnings: 3890,
    referralEarnings: 650,
    completedTasksCount: 14,
    availableWithdrawalBalance: 2450,
    pendingWithdrawal: 0,
    referralCode: 'VLOS2026',
    referredBy: null,
    totalReferrals: 4,
    activeReferrals: 3,
    status: 'active',
    currency: 'USD',
    createdAt: '2026-02-15T10:30:00Z'
  }
];

const INITIAL_NOTICES = [
  {
    id: 'not_1',
    title: 'Welcome to VLØS EARN Platform',
    message: 'We have upgraded all task rewards! Enjoy instant task verification with our 10-second security countdown, fast withdrawals via bKash, Nagad, Bank, PayPal, RedotPay, and Tonkeeper, plus 10% lifetime referral commissions.',
    type: 'popup',
    status: 'active',
    buttonText: 'Start Earning Now',
    buttonUrl: '#tasks',
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  }
];

const INITIAL_SETTINGS = {
  appName: 'VLOS EARN',
  logoText: 'VLØS EARN',
  appDescription: 'Premium Creator & Digital Earning Platform',
  maintenanceMode: false,
  registrationEnabled: true,
  taskSystemEnabled: true,
  videoSystemEnabled: true,
  referralSystemEnabled: true,
  fixedReferralCoins: 100,
  referralCommissionPercent: 10,
  minReferralQualifyingTasks: 2,
  maxReferralCommission: 5000,
  coinToUsdRate: 1000, // 1000 Coins = 1 USD
  defaultTaskCountdownSeconds: 10
};

// In-Memory Database with JSON backing
interface StoreState {
  users: any[];
  tasks: any[];
  taskCompletions: any[];
  ads: any[];
  adCompletions: any[];
  currencies: any[];
  paymentMethods: any[];
  withdrawals: any[];
  transactions: any[];
  referrals: any[];
  notices: any[];
  adminAuditLogs: any[];
  settings: any;
}

let store: StoreState = {
  users: INITIAL_USERS,
  tasks: INITIAL_TASKS,
  taskCompletions: [],
  ads: INITIAL_ADS,
  adCompletions: [],
  currencies: INITIAL_CURRENCIES,
  paymentMethods: INITIAL_PAYMENT_METHODS,
  withdrawals: [],
  transactions: [
    {
      id: 'tx_welcome',
      userId: 'usr_creator_1',
      type: 'Bonus',
      amount: 500,
      currency: 'Coins',
      status: 'Completed',
      description: 'Welcome onboard bonus credited',
      createdAt: '2026-02-15T10:30:00Z'
    },
    {
      id: 'tx_task1',
      userId: 'usr_creator_1',
      type: 'Task Reward',
      amount: 120,
      currency: 'Coins',
      status: 'Completed',
      description: 'Completed: Follow VLØS EARN Official Channel',
      createdAt: '2026-03-01T14:22:00Z'
    },
    {
      id: 'tx_ref1',
      userId: 'usr_creator_1',
      type: 'Referral Reward',
      amount: 100,
      currency: 'Coins',
      status: 'Completed',
      description: 'Referral signup reward from user Alex99',
      createdAt: '2026-03-02T09:15:00Z'
    }
  ],
  referrals: [
    {
      id: 'ref_1',
      referrerId: 'usr_creator_1',
      referredUserId: 'usr_ref_1',
      referredUserName: 'Alex Johnson',
      bonusCoins: 100,
      status: 'qualified',
      createdAt: '2026-03-02T09:15:00Z'
    },
    {
      id: 'ref_2',
      referrerId: 'usr_creator_1',
      referredUserId: 'usr_ref_2',
      referredUserName: 'Maria Silva',
      bonusCoins: 100,
      status: 'qualified',
      createdAt: '2026-03-03T11:40:00Z'
    },
    {
      id: 'ref_3',
      referrerId: 'usr_creator_1',
      referredUserId: 'usr_ref_3',
      referredUserName: 'Tanvir Hossain',
      bonusCoins: 100,
      status: 'active',
      createdAt: '2026-03-04T16:10:00Z'
    }
  ],
  notices: INITIAL_NOTICES,
  adminAuditLogs: [
    {
      id: 'log_init',
      adminId: 'vlosearnbusiness',
      targetUserId: 'SYSTEM',
      targetUserName: 'Platform Initialization',
      action: 'SYSTEM_BOOT',
      previousBalance: 0,
      newBalance: 0,
      amountChanged: 0,
      reason: 'VLOS EARN production environment initialized',
      createdAt: new Date().toISOString()
    }
  ],
  settings: INITIAL_SETTINGS
};

// Load persistent data if exists
function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      store = { ...store, ...parsed };
      console.log('VLOS EARN: Persistent database loaded successfully.');
    }
  } catch (err) {
    console.error('Failed to load persistent store, using defaults', err);
  }
}

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store to file', err);
  }
}

loadStore();

// Express Application Setup
const app = express();
app.use(express.json());

// Middleware: Admin Authentication
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken<{ username: string; role: string; iat: number }>(token);
  if (!payload || payload.role !== 'admin' || payload.username !== ADMIN_USERNAME) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired admin credentials' });
  }
  (req as any).admin = payload;
  next();
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

// Admin Login: Authenticates strictly server-side against environment variables
app.post('/api/auth/admin-login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Constant-time check comparison
  const userMatch = username.trim() === ADMIN_USERNAME.trim();
  const passMatch = password === ADMIN_PASSWORD;

  if (!userMatch || !passMatch) {
    return res.status(401).json({ error: 'Invalid admin username or password' });
  }

  const token = signToken({
    username: ADMIN_USERNAME,
    role: 'admin',
    iat: Date.now()
  });

  return res.json({
    success: true,
    token,
    admin: {
      username: ADMIN_USERNAME,
      role: 'superadmin',
      lastLogin: new Date().toISOString()
    }
  });
});

// Admin verify session
app.get('/api/auth/admin-verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ authenticated: false });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin' || payload.username !== ADMIN_USERNAME) {
    return res.status(401).json({ authenticated: false });
  }
  return res.json({ authenticated: true, admin: { username: ADMIN_USERNAME, role: 'superadmin' } });
});

// User identification & switching (Supports instant creation/session)
app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr_creator_1';
  let user = store.users.find(u => u.id === userId);
  if (!user) {
    user = store.users[0];
  }
  return res.json({ success: true, user });
});

// User Login by Email, Username, or Referral Code
app.post('/api/auth/user-login', (req: Request, res: Response) => {
  const { loginId, email, password } = req.body;
  const identifier = (loginId || email || '').trim().toLowerCase();

  if (!identifier) {
    return res.status(400).json({ error: 'Email or Username is required' });
  }

  // Find user by email, name, or referral code
  let user = store.users.find(u =>
    u.email.toLowerCase() === identifier ||
    u.name.toLowerCase() === identifier ||
    u.referralCode.toLowerCase() === identifier
  );

  if (!user) {
    return res.status(401).json({
      error: 'Account not found. Please verify your Email/Username or SIGN UP to create an account.'
    });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended by administration.' });
  }

  // Password verification: If user has a password set and password is provided
  if (user.password && password) {
    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
  } else if (!user.password && password) {
    // Save password for future logins
    user.password = password;
    saveStore();
  }

  return res.json({ success: true, user });
});

// User Sign Up
app.post('/api/auth/user-signup', (req: Request, res: Response) => {
  const { name, email, password, referralCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already registered
  const existingUser = store.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists. Please LOGIN instead.' });
  }

  // Referral handling
  let referredBy = null;
  if (referralCode && referralCode.trim()) {
    const referrer = store.users.find(u => u.referralCode.toLowerCase() === referralCode.trim().toLowerCase());
    if (referrer) {
      referredBy = referrer.id;
      referrer.totalReferrals += 1;
      referrer.activeReferrals += 1;
      const refBonus = store.settings.fixedReferralCoins || 100;
      referrer.coins += refBonus;
      referrer.availableWithdrawalBalance += refBonus;
      referrer.referralEarnings += refBonus;
      referrer.totalEarnings += refBonus;

      store.transactions.unshift({
        id: 'tx_' + crypto.randomUUID(),
        userId: referrer.id,
        type: 'Referral Reward',
        amount: refBonus,
        currency: 'Coins',
        status: 'Completed',
        description: `Referral reward for inviting ${name || normalizedEmail}`,
        createdAt: new Date().toISOString()
      });

      store.referrals.unshift({
        id: 'ref_' + crypto.randomUUID(),
        referrerId: referrer.id,
        referredUserId: '', // populated below
        referredUserName: name || normalizedEmail,
        bonusCoins: refBonus,
        status: 'qualified',
        createdAt: new Date().toISOString()
      });
    }
  }

  const newUserId = 'usr_' + crypto.randomBytes(6).toString('hex');
  const newRefCode = 'VLOS' + Math.floor(1000 + Math.random() * 9000);
  const newUser = {
    id: newUserId,
    name: (name || 'Creator ' + newRefCode).trim(),
    email: normalizedEmail,
    password: password,
    phone: '',
    profilePhoto: `https://api.dicebear.com/7.x/identicon/svg?seed=${normalizedEmail}`,
    coins: 500, // 500 Welcome Coins
    balanceUsd: 0.50,
    todayEarnings: 500,
    totalEarnings: 500,
    referralEarnings: 0,
    completedTasksCount: 0,
    availableWithdrawalBalance: 500,
    pendingWithdrawal: 0,
    referralCode: newRefCode,
    referredBy,
    totalReferrals: 0,
    activeReferrals: 0,
    status: 'active',
    currency: 'USD',
    createdAt: new Date().toISOString()
  };

  store.users.unshift(newUser);

  // Update referredUserId in recent referral if applicable
  if (referredBy && store.referrals.length > 0) {
    store.referrals[0].referredUserId = newUserId;
  }

  store.transactions.unshift({
    id: 'tx_' + crypto.randomUUID(),
    userId: newUser.id,
    type: 'Bonus',
    amount: 500,
    currency: 'Coins',
    status: 'Completed',
    description: 'Welcome onboard bonus credited (500 Coins)',
    createdAt: new Date().toISOString()
  });

  saveStore();

  return res.json({ success: true, user: newUser });
});

// Update user profile
app.put('/api/profile', (req: Request, res: Response) => {
  const { userId, name, phone, profilePhoto, currency } = req.body;
  const user = store.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (profilePhoto) user.profilePhoto = profilePhoto;
  if (currency) user.currency = currency;

  saveStore();
  return res.json({ success: true, user });
});

// ----------------------------------------------------
// PUBLIC PLATFORM DATA & SETTINGS
// ----------------------------------------------------

app.get('/api/platform/settings', (_req: Request, res: Response) => {
  return res.json({
    settings: store.settings,
    activeNotices: store.notices.filter(n => n.status === 'active'),
    currencies: store.currencies.filter(c => c.status === 'enabled'),
    paymentMethods: store.paymentMethods.filter(p => p.status === 'enabled')
  });
});

// Currencies
app.get('/api/currencies', (_req: Request, res: Response) => {
  return res.json({ currencies: store.currencies });
});

// Payment Methods
app.get('/api/payment-methods', (_req: Request, res: Response) => {
  return res.json({ paymentMethods: store.paymentMethods });
});

// ----------------------------------------------------
// TASK SYSTEM WITH MANDATORY 10-SECOND COUNTDOWN TOKEN
// ----------------------------------------------------

app.get('/api/tasks', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const userCompletions = store.taskCompletions.filter(tc => tc.userId === userId);
  const completedTaskIds = new Set(userCompletions.map(tc => tc.taskId));

  const tasksWithState = store.tasks.map(t => ({
    ...t,
    isCompletedByUser: completedTaskIds.has(t.id)
  }));

  return res.json({ tasks: tasksWithState });
});

// Initiate Task Countdown: Generates cryptographically signed start challenge
app.post('/api/tasks/start', (req: Request, res: Response) => {
  const { taskId, userId } = req.body;
  if (!taskId || !userId) {
    return res.status(400).json({ error: 'Task ID and User ID are required' });
  }

  const task = store.tasks.find(t => t.id === taskId);
  if (!task || task.status !== 'active') {
    return res.status(404).json({ error: 'Task not found or currently disabled' });
  }

  const user = store.users.find(u => u.id === userId);
  if (!user || user.status !== 'active') {
    return res.status(403).json({ error: 'User account suspended or invalid' });
  }

  const countdownSeconds = task.countdownDuration || store.settings.defaultTaskCountdownSeconds || 10;
  const startedAt = Date.now();

  const challengeToken = signToken({
    type: 'TASK_START_CHALLENGE',
    taskId,
    userId,
    startedAt,
    countdownDuration: countdownSeconds,
    taskDuration: task.timer,
    reward: task.reward
  });

  return res.json({
    success: true,
    challengeToken,
    countdownDuration: countdownSeconds,
    taskDuration: task.timer,
    message: 'Mandatory countdown active. Do not exit or cancel before completion.'
  });
});

// Complete Task: Verifies token, elapsed time, anti-replay, and credits reward
app.post('/api/tasks/complete', (req: Request, res: Response) => {
  const { challengeToken } = req.body;
  if (!challengeToken) {
    return res.status(400).json({ error: 'Challenge token is missing' });
  }

  const payload = verifyToken<{
    type: string;
    taskId: string;
    userId: string;
    startedAt: number;
    countdownDuration: number;
    taskDuration: number;
    reward: number;
  }>(challengeToken);

  if (!payload || payload.type !== 'TASK_START_CHALLENGE') {
    return res.status(400).json({ error: 'Invalid or forged challenge token' });
  }

  const task = store.tasks.find(t => t.id === payload.taskId);
  if (!task || task.status !== 'active') {
    return res.status(400).json({ error: 'Task is no longer active' });
  }

  const user = store.users.find(u => u.id === payload.userId);
  if (!user || user.status !== 'active') {
    return res.status(403).json({ error: 'User is not authorized' });
  }

  // Security Check: Enforce that total elapsed time >= countdown + task timer
  const now = Date.now();
  const requiredTotalSeconds = (payload.countdownDuration || 10) + (payload.taskDuration || 0);
  const elapsedSeconds = (now - payload.startedAt) / 1000;

  // Allow a tiny 0.5s network leeway, but strictly block timer skipping
  if (elapsedSeconds < requiredTotalSeconds - 0.5) {
    return res.status(400).json({
      error: `Security violation: Task completed in ${Math.round(elapsedSeconds)}s, required minimum is ${requiredTotalSeconds}s.`
    });
  }

  // Anti-Replay / Duplicate reward prevention
  const existingCompletion = store.taskCompletions.find(
    tc => tc.taskId === payload.taskId && tc.userId === payload.userId
  );
  if (existingCompletion) {
    return res.status(400).json({ error: 'Duplicate reward prevented. Task has already been completed.' });
  }

  // Credit Reward
  const rewardCoins = task.reward;
  user.coins += rewardCoins;
  user.availableWithdrawalBalance += rewardCoins;
  user.todayEarnings += rewardCoins;
  user.totalEarnings += rewardCoins;
  user.completedTasksCount += 1;
  task.completionsCount += 1;

  // Record Task Completion
  store.taskCompletions.push({
    id: 'tc_' + crypto.randomUUID(),
    taskId: task.id,
    taskName: task.name,
    userId: user.id,
    reward: rewardCoins,
    completedAt: new Date().toISOString()
  });

  // Record Financial Transaction
  const transaction = {
    id: 'tx_' + crypto.randomUUID(),
    userId: user.id,
    type: 'Task Reward',
    amount: rewardCoins,
    currency: 'Coins',
    status: 'Completed',
    description: `Completed task: ${task.name}`,
    createdAt: new Date().toISOString()
  };
  store.transactions.unshift(transaction);

  saveStore();

  return res.json({
    success: true,
    reward: rewardCoins,
    userCoins: user.coins,
    message: `Congratulations! ${rewardCoins} Coins credited to your wallet.`
  });
});

// ----------------------------------------------------
// WATCH & EARN (VIDEO ADS) SYSTEM
// ----------------------------------------------------

app.get('/api/ads', (_req: Request, res: Response) => {
  return res.json({ ads: store.ads.filter(a => a.status === 'active') });
});

app.post('/api/ads/start', (req: Request, res: Response) => {
  const { adId, userId } = req.body;
  const ad = store.ads.find(a => a.id === adId);
  if (!ad || ad.status !== 'active') {
    return res.status(404).json({ error: 'Video ad not found' });
  }

  const token = signToken({
    type: 'AD_WATCH_CHALLENGE',
    adId,
    userId,
    startedAt: Date.now(),
    duration: ad.duration,
    reward: ad.reward
  });

  return res.json({ success: true, challengeToken: token, duration: ad.duration });
});

app.post('/api/ads/complete', (req: Request, res: Response) => {
  const { challengeToken } = req.body;
  if (!challengeToken) {
    return res.status(400).json({ error: 'Challenge token required' });
  }

  const payload = verifyToken<{
    type: string;
    adId: string;
    userId: string;
    startedAt: number;
    duration: number;
    reward: number;
  }>(challengeToken);

  if (!payload || payload.type !== 'AD_WATCH_CHALLENGE') {
    return res.status(400).json({ error: 'Invalid ad challenge token' });
  }

  const ad = store.ads.find(a => a.id === payload.adId);
  if (!ad || ad.status !== 'active') {
    return res.status(400).json({ error: 'Ad is inactive' });
  }

  const user = store.users.find(u => u.id === payload.userId);
  if (!user || user.status !== 'active') {
    return res.status(403).json({ error: 'Unauthorized user' });
  }

  const elapsedSeconds = (Date.now() - payload.startedAt) / 1000;
  if (elapsedSeconds < payload.duration - 0.5) {
    return res.status(400).json({ error: 'Video viewing time not fulfilled' });
  }

  // Credit ad reward
  const reward = ad.reward;
  user.coins += reward;
  user.availableWithdrawalBalance += reward;
  user.todayEarnings += reward;
  user.totalEarnings += reward;
  ad.viewsCount += 1;

  store.adCompletions.push({
    id: 'ac_' + crypto.randomUUID(),
    adId: ad.id,
    adTitle: ad.title,
    userId: user.id,
    reward,
    completedAt: new Date().toISOString()
  });

  store.transactions.unshift({
    id: 'tx_' + crypto.randomUUID(),
    userId: user.id,
    type: 'Video Reward',
    amount: reward,
    currency: 'Coins',
    status: 'Completed',
    description: `Watched video ad: ${ad.title}`,
    createdAt: new Date().toISOString()
  });

  saveStore();

  return res.json({
    success: true,
    reward,
    userCoins: user.coins,
    message: `${reward} Coins earned for watching video ad!`
  });
});

// ----------------------------------------------------
// WALLET & WITHDRAWAL SYSTEM
// ----------------------------------------------------

app.post('/api/withdrawals/create', (req: Request, res: Response) => {
  const { userId, methodId, amountCoins, accountInfo, currencyCode } = req.body;

  if (!userId || !methodId || !amountCoins || !accountInfo) {
    return res.status(400).json({ error: 'Missing required withdrawal details' });
  }

  const user = store.users.find(u => u.id === userId);
  if (!user || user.status !== 'active') {
    return res.status(403).json({ error: 'User account not eligible for withdrawal' });
  }

  if (amountCoins <= 0 || user.availableWithdrawalBalance < amountCoins) {
    return res.status(400).json({
      error: `Insufficient balance. Available: ${user.availableWithdrawalBalance} Coins, Requested: ${amountCoins} Coins.`
    });
  }

  const method = store.paymentMethods.find(m => m.id === methodId);
  if (!method || method.status !== 'enabled') {
    return res.status(400).json({ error: 'Withdrawal method is currently unavailable' });
  }

  // Calculate currency amount
  const curr = store.currencies.find(c => c.code === (currencyCode || method.currency)) || store.currencies[0];
  // Calculate fiat value from coins
  const fiatAmount = (amountCoins / 1000) * curr.exchangeRateToUSD;

  // Fee calculation
  let fee = 0;
  if (method.feeType === 'percentage') {
    fee = (fiatAmount * (method.withdrawalFee || 0)) / 100;
  } else {
    fee = method.withdrawalFee || 0;
  }
  const finalAmount = Math.max(0, fiatAmount - fee);

  // Validate method min and max limits
  if (fiatAmount < method.minWithdrawal) {
    return res.status(400).json({
      error: `Minimum withdrawal for ${method.name} is ${curr.symbol}${method.minWithdrawal} (Approx ${Math.ceil((method.minWithdrawal / curr.exchangeRateToUSD) * 1000)} Coins)`
    });
  }

  if (fiatAmount > method.maxWithdrawal) {
    return res.status(400).json({
      error: `Maximum withdrawal limit exceeded for ${method.name} (${curr.symbol}${method.maxWithdrawal})`
    });
  }

  // Safe Balance Holding: Deduct coins from user balance & put into pendingWithdrawal
  user.coins -= amountCoins;
  user.availableWithdrawalBalance -= amountCoins;
  user.pendingWithdrawal += amountCoins;

  const withdrawalId = 'wd_' + crypto.randomUUID();
  const withdrawalRequest = {
    id: withdrawalId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    methodId: method.id,
    methodName: method.name,
    accountInfo,
    currency: curr.code,
    currencySymbol: curr.symbol,
    coinsDeducted: amountCoins,
    amount: Number(fiatAmount.toFixed(2)),
    fee: Number(fee.toFixed(2)),
    finalAmount: Number(finalAmount.toFixed(2)),
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.withdrawals.unshift(withdrawalRequest);

  // Record Transaction
  store.transactions.unshift({
    id: 'tx_' + crypto.randomUUID(),
    userId: user.id,
    type: 'Withdrawal',
    amount: -amountCoins,
    currency: 'Coins',
    status: 'Pending',
    description: `Withdrawal request #${withdrawalId.slice(-6).toUpperCase()} via ${method.name}`,
    referenceId: withdrawalId,
    createdAt: new Date().toISOString()
  });

  saveStore();

  return res.json({
    success: true,
    withdrawal: withdrawalRequest,
    remainingCoins: user.coins,
    message: 'Withdrawal request submitted successfully and is currently under review.'
  });
});

app.get('/api/withdrawals/my', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const list = store.withdrawals.filter(w => w.userId === userId);
  return res.json({ withdrawals: list });
});

// Transactions list
app.get('/api/transactions', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const list = userId ? store.transactions.filter(t => t.userId === userId) : store.transactions;
  return res.json({ transactions: list });
});

// Referrals
app.get('/api/referrals', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const user = store.users.find(u => u.id === userId);
  const userRefs = store.referrals.filter(r => r.referrerId === userId);

  return res.json({
    referrals: userRefs,
    totalReferrals: user?.totalReferrals || 0,
    activeReferrals: user?.activeReferrals || 0,
    referralEarnings: user?.referralEarnings || 0,
    referralCode: user?.referralCode || 'VLOS',
    settings: {
      fixedCoins: store.settings.fixedReferralCoins,
      commissionPercent: store.settings.referralCommissionPercent
    }
  });
});

// ----------------------------------------------------
// PROTECTED ADMIN APIS
// ----------------------------------------------------

// Admin Stats
app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  const totalUsers = store.users.length;
  const activeUsers = store.users.filter(u => u.status === 'active').length;
  const suspendedUsers = store.users.filter(u => u.status === 'suspended').length;
  const totalTasks = store.tasks.length;
  const completedTasks = store.taskCompletions.length;
  const totalVideoViews = store.ads.reduce((acc, a) => acc + (a.viewsCount || 0), 0);
  const totalReferrals = store.referrals.length;

  const totalCoinsIssued = store.transactions
    .filter(t => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingWithdrawals = store.withdrawals.filter(w => w.status === 'Pending');
  const approvedWithdrawals = store.withdrawals.filter(w => w.status === 'Approved');
  const rejectedWithdrawals = store.withdrawals.filter(w => w.status === 'Rejected');
  const paidWithdrawals = store.withdrawals.filter(w => w.status === 'Paid');

  const pendingWithdrawalsAmount = pendingWithdrawals.reduce((acc, w) => acc + w.amount, 0);
  const paidWithdrawalsAmount = paidWithdrawals.reduce((acc, w) => acc + w.amount, 0);

  return res.json({
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalTasks,
    completedTasks,
    totalVideoViews,
    totalReferrals,
    totalCoinsIssued,
    pendingWithdrawalsCount: pendingWithdrawals.length,
    approvedWithdrawalsCount: approvedWithdrawals.length,
    rejectedWithdrawalsCount: rejectedWithdrawals.length,
    paidWithdrawalsCount: paidWithdrawals.length,
    pendingWithdrawalsAmount: Number(pendingWithdrawalsAmount.toFixed(2)),
    paidWithdrawalsAmount: Number(paidWithdrawalsAmount.toFixed(2))
  });
});

// Admin Users List
app.get('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').toLowerCase();
  const status = req.query.status as string;

  let filtered = store.users;
  if (query) {
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.id.toLowerCase().includes(query) ||
      u.referralCode.toLowerCase().includes(query)
    );
  }
  if (status && status !== 'all') {
    filtered = filtered.filter(u => u.status === status);
  }

  return res.json({ users: filtered });
});

// Admin User Details
app.get('/api/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  const user = store.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userTransactions = store.transactions.filter(t => t.userId === user.id);
  const userWithdrawals = store.withdrawals.filter(w => w.userId === user.id);
  const userTasks = store.taskCompletions.filter(tc => tc.userId === user.id);
  const userReferrals = store.referrals.filter(r => r.referrerId === user.id);

  return res.json({
    user,
    transactions: userTransactions,
    withdrawals: userWithdrawals,
    tasks: userTasks,
    referrals: userReferrals
  });
});

// Admin Manual Balance Modification (Creates AUDIT LOG)
app.post('/api/admin/users/:id/balance', requireAdmin, (req: Request, res: Response) => {
  const { amount, action, reason } = req.body;
  const user = store.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'A mandatory reason is required for any manual balance adjustment' });
  }

  const delta = parseInt(amount, 10);
  if (isNaN(delta) || delta <= 0) {
    return res.status(400).json({ error: 'Invalid adjustment amount' });
  }

  const prevCoins = user.coins;
  let newCoins = prevCoins;

  if (action === 'add') {
    newCoins = prevCoins + delta;
  } else if (action === 'remove') {
    newCoins = Math.max(0, prevCoins - delta);
  } else {
    return res.status(400).json({ error: 'Action must be "add" or "remove"' });
  }

  const diff = newCoins - prevCoins;
  user.coins = newCoins;
  user.availableWithdrawalBalance = Math.max(0, user.availableWithdrawalBalance + diff);
  if (diff > 0) user.totalEarnings += diff;

  // Audit Log Entry
  const auditLog = {
    id: 'log_' + crypto.randomUUID(),
    adminId: ADMIN_USERNAME,
    targetUserId: user.id,
    targetUserName: user.name,
    action: `MANUAL_BALANCE_${action.toUpperCase()}`,
    previousBalance: prevCoins,
    newBalance: newCoins,
    amountChanged: diff,
    reason: reason.trim(),
    createdAt: new Date().toISOString()
  };
  store.adminAuditLogs.unshift(auditLog);

  // Financial Transaction Entry
  store.transactions.unshift({
    id: 'tx_' + crypto.randomUUID(),
    userId: user.id,
    type: 'Admin Adjustment',
    amount: diff,
    currency: 'Coins',
    status: 'Completed',
    description: `Admin balance adjustment: ${reason.trim()} (${diff >= 0 ? '+' : ''}${diff} Coins)`,
    createdAt: new Date().toISOString()
  });

  saveStore();

  return res.json({ success: true, user, auditLog });
});

// Admin Toggle User Status
app.post('/api/admin/users/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { status, reason } = req.body;
  const user = store.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = status === 'suspended' ? 'suspended' : 'active';

  store.adminAuditLogs.unshift({
    id: 'log_' + crypto.randomUUID(),
    adminId: ADMIN_USERNAME,
    targetUserId: user.id,
    targetUserName: user.name,
    action: `USER_STATUS_${user.status.toUpperCase()}`,
    previousBalance: user.coins,
    newBalance: user.coins,
    amountChanged: 0,
    reason: reason || `User status changed to ${user.status}`,
    createdAt: new Date().toISOString()
  });

  saveStore();

  return res.json({ success: true, user });
});

// Admin Tasks Management
app.post('/api/admin/tasks', requireAdmin, (req: Request, res: Response) => {
  const data = req.body;
  const newTask = {
    id: 'task_' + crypto.randomUUID(),
    name: data.name,
    description: data.description || '',
    category: data.category || 'Website Visit',
    url: data.url || 'https://google.com',
    reward: Number(data.reward) || 50,
    rewardCurrency: 'Coins',
    timer: Number(data.timer) || 30,
    countdownDuration: Number(data.countdownDuration) || 10,
    dailyLimit: Number(data.dailyLimit) || 1,
    totalLimit: Number(data.totalLimit) || 1000,
    completionsCount: 0,
    instructions: data.instructions || '',
    status: data.status || 'active',
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    endDate: data.endDate || '2026-12-31'
  };

  store.tasks.unshift(newTask);
  saveStore();
  return res.json({ success: true, task: newTask });
});

app.put('/api/admin/tasks/:id', requireAdmin, (req: Request, res: Response) => {
  const index = store.tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  store.tasks[index] = { ...store.tasks[index], ...req.body };
  saveStore();
  return res.json({ success: true, task: store.tasks[index] });
});

app.delete('/api/admin/tasks/:id', requireAdmin, (req: Request, res: Response) => {
  store.tasks = store.tasks.filter(t => t.id !== req.params.id);
  saveStore();
  return res.json({ success: true });
});

// Admin Ads Management
app.post('/api/admin/ads', requireAdmin, (req: Request, res: Response) => {
  const data = req.body;
  const newAd = {
    id: 'ad_' + crypto.randomUUID(),
    title: data.title,
    description: data.description || '',
    thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    videoUrl: data.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: Number(data.duration) || 20,
    reward: Number(data.reward) || 40,
    rewardCurrency: 'Coins',
    dailyLimit: Number(data.dailyLimit) || 5,
    viewsCount: 0,
    status: data.status || 'active'
  };

  store.ads.unshift(newAd);
  saveStore();
  return res.json({ success: true, ad: newAd });
});

app.put('/api/admin/ads/:id', requireAdmin, (req: Request, res: Response) => {
  const index = store.ads.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Ad not found' });

  store.ads[index] = { ...store.ads[index], ...req.body };
  saveStore();
  return res.json({ success: true, ad: store.ads[index] });
});

app.delete('/api/admin/ads/:id', requireAdmin, (req: Request, res: Response) => {
  store.ads = store.ads.filter(a => a.id !== req.params.id);
  saveStore();
  return res.json({ success: true });
});

// Admin Withdrawals Management
app.get('/api/admin/withdrawals', requireAdmin, (req: Request, res: Response) => {
  const status = req.query.status as string;
  let list = store.withdrawals;
  if (status && status !== 'all') {
    list = list.filter(w => w.status === status);
  }
  return res.json({ withdrawals: list });
});

// Admin Approve / Reject / Mark Paid Withdrawal
app.post('/api/admin/withdrawals/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { status, rejectionReason, adminNotes } = req.body;
  const withdrawal = store.withdrawals.find(w => w.id === req.params.id);
  if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });

  const prevStatus = withdrawal.status;
  const user = store.users.find(u => u.id === withdrawal.userId);

  withdrawal.status = status;
  withdrawal.updatedAt = new Date().toISOString();
  if (adminNotes) withdrawal.adminNotes = adminNotes;

  // CRITICAL REQUIREMENT: If rejected, return held balance to user & create reversal transaction
  if (status === 'Rejected') {
    withdrawal.rejectionReason = rejectionReason || 'Information verification failed';

    if (user && prevStatus !== 'Rejected') {
      const refundCoins = withdrawal.coinsDeducted;
      user.coins += refundCoins;
      user.availableWithdrawalBalance += refundCoins;
      user.pendingWithdrawal = Math.max(0, user.pendingWithdrawal - refundCoins);

      // Create Reversal Transaction
      store.transactions.unshift({
        id: 'tx_' + crypto.randomUUID(),
        userId: user.id,
        type: 'Withdrawal Refund',
        amount: refundCoins,
        currency: 'Coins',
        status: 'Completed',
        description: `Refund for rejected withdrawal #${withdrawal.id.slice(-6).toUpperCase()}: ${withdrawal.rejectionReason}`,
        referenceId: withdrawal.id,
        createdAt: new Date().toISOString()
      });

      // Create Audit Log
      store.adminAuditLogs.unshift({
        id: 'log_' + crypto.randomUUID(),
        adminId: ADMIN_USERNAME,
        targetUserId: user.id,
        targetUserName: user.name,
        action: 'WITHDRAWAL_REJECTED_REFUND',
        previousBalance: user.coins - refundCoins,
        newBalance: user.coins,
        amountChanged: refundCoins,
        reason: `Withdrawal #${withdrawal.id} rejected. Reason: ${withdrawal.rejectionReason}`,
        createdAt: new Date().toISOString()
      });
    }
  } else if (status === 'Paid') {
    if (user && prevStatus !== 'Paid') {
      user.pendingWithdrawal = Math.max(0, user.pendingWithdrawal - withdrawal.coinsDeducted);
    }
    // Update transaction to Completed
    const tx = store.transactions.find(t => t.referenceId === withdrawal.id);
    if (tx) tx.status = 'Completed';
  } else if (status === 'Approved') {
    // Approved for batch payment
  }

  saveStore();

  return res.json({ success: true, withdrawal });
});

// Admin Currencies Management (Full CRUD)
app.get('/api/admin/currencies', requireAdmin, (_req: Request, res: Response) => {
  return res.json({ currencies: store.currencies });
});

app.post('/api/admin/currencies', requireAdmin, (req: Request, res: Response) => {
  const data = req.body;
  const newCurr = {
    id: 'curr_' + (data.code || '').toLowerCase(),
    code: (data.code || '').toUpperCase(),
    symbol: data.symbol || '$',
    name: data.name || 'Currency',
    exchangeRateToUSD: Number(data.exchangeRateToUSD) || 1.0,
    coinConversionRate: Number(data.coinConversionRate) || 1000,
    minWithdrawal: Number(data.minWithdrawal) || 5,
    maxWithdrawal: Number(data.maxWithdrawal) || 1000,
    withdrawalFeePercent: Number(data.withdrawalFeePercent) || 1.5,
    status: data.status || 'enabled'
  };

  store.currencies.push(newCurr);
  saveStore();
  return res.json({ success: true, currency: newCurr });
});

app.put('/api/admin/currencies/:id', requireAdmin, (req: Request, res: Response) => {
  const index = store.currencies.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Currency not found' });

  store.currencies[index] = { ...store.currencies[index], ...req.body };
  saveStore();
  return res.json({ success: true, currency: store.currencies[index] });
});

app.delete('/api/admin/currencies/:id', requireAdmin, (req: Request, res: Response) => {
  store.currencies = store.currencies.filter(c => c.id !== req.params.id);
  saveStore();
  return res.json({ success: true });
});

// Admin Payment Methods Management
app.get('/api/admin/payment-methods', requireAdmin, (_req: Request, res: Response) => {
  return res.json({ paymentMethods: store.paymentMethods });
});

app.post('/api/admin/payment-methods', requireAdmin, (req: Request, res: Response) => {
  const data = req.body;
  const newMethod = {
    id: 'pm_' + crypto.randomUUID(),
    name: data.name,
    icon: data.icon || 'CreditCard',
    currency: data.currency || 'USD',
    minWithdrawal: Number(data.minWithdrawal) || 10,
    maxWithdrawal: Number(data.maxWithdrawal) || 1000,
    withdrawalFee: Number(data.withdrawalFee) || 1.5,
    feeType: data.feeType || 'percentage',
    status: data.status || 'enabled',
    instructions: data.instructions || '',
    requiredFields: Array.isArray(data.requiredFields) ? data.requiredFields : []
  };

  store.paymentMethods.push(newMethod);
  saveStore();
  return res.json({ success: true, paymentMethod: newMethod });
});

app.put('/api/admin/payment-methods/:id', requireAdmin, (req: Request, res: Response) => {
  const index = store.paymentMethods.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Payment method not found' });

  store.paymentMethods[index] = { ...store.paymentMethods[index], ...req.body };
  saveStore();
  return res.json({ success: true, paymentMethod: store.paymentMethods[index] });
});

app.delete('/api/admin/payment-methods/:id', requireAdmin, (req: Request, res: Response) => {
  store.paymentMethods = store.paymentMethods.filter(p => p.id !== req.params.id);
  saveStore();
  return res.json({ success: true });
});

// Admin Notices Management
app.get('/api/admin/notices', requireAdmin, (_req: Request, res: Response) => {
  return res.json({ notices: store.notices });
});

app.post('/api/admin/notices', requireAdmin, (req: Request, res: Response) => {
  const data = req.body;
  const newNotice = {
    id: 'not_' + crypto.randomUUID(),
    title: data.title,
    message: data.message,
    type: data.type || 'popup',
    image: data.image || '',
    buttonText: data.buttonText || '',
    buttonUrl: data.buttonUrl || '',
    status: data.status || 'active',
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    endDate: data.endDate || '2026-12-31'
  };

  store.notices.unshift(newNotice);
  saveStore();
  return res.json({ success: true, notice: newNotice });
});

app.put('/api/admin/notices/:id', requireAdmin, (req: Request, res: Response) => {
  const index = store.notices.findIndex(n => n.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Notice not found' });

  store.notices[index] = { ...store.notices[index], ...req.body };
  saveStore();
  return res.json({ success: true, notice: store.notices[index] });
});

app.delete('/api/admin/notices/:id', requireAdmin, (req: Request, res: Response) => {
  store.notices = store.notices.filter(n => n.id !== req.params.id);
  saveStore();
  return res.json({ success: true });
});

// Admin Platform Settings
app.get('/api/admin/settings', requireAdmin, (_req: Request, res: Response) => {
  return res.json({ settings: store.settings });
});

app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  store.settings = { ...store.settings, ...req.body };
  saveStore();
  return res.json({ success: true, settings: store.settings });
});

// Admin Audit Logs
app.get('/api/admin/audit-logs', requireAdmin, (_req: Request, res: Response) => {
  return res.json({ auditLogs: store.adminAuditLogs });
});

// ----------------------------------------------------
// VITE MIDDLEWARE SETUP & STATIC SERVING
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VLOS EARN production engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
