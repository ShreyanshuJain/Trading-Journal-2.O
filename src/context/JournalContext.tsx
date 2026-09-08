import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
} from '../firebase/realtime';
import {
  ref as storageRef,
  uploadString,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import {
  Trade,
  Account,
  Strategy,
  Tag,
  UserSettings,
  DateRangeFilter,
  DashboardStats,
  EquityCurvePoint,
  StrategyPerformance,
  PairPerformance,
  SessionPerformance,
  DayOfWeekPerformance,
  NewsPerformance,
  TradeScreenshot,
} from '../types';
import {
  initialAccounts,
  initialStrategies,
  initialTags,
  initialSettings,
} from '../data/mockData';
import {
  filterTradesByDateRange,
  calculateDashboardStats,
  calculateEquityCurve,
  calculateStrategyStats,
  calculatePairStats,
  calculateSessionStats,
  calculateDayOfWeekStats,
  calculateNewsStats,
} from '../utils/calculations';
import {
  uploadToCloudinary,
  isCloudinaryConfigured,
  uploadScreenshotImage,
} from '../utils/imageUtils';

export type NavigationPage =
  | 'dashboard'
  | 'journal'
  | 'calendar'
  | 'gallery'
  | 'strategies'
  | 'analytics'
  | 'risk'
  | 'accounts'
  | 'settings';

interface JournalContextType {
  // Loading
  dataLoading: boolean;

  // Navigation
  currentPage: NavigationPage;
  setCurrentPage: (page: NavigationPage) => void;

  // Accounts
  accounts: Account[];
  activeAccountId: string;
  setActiveAccountId: (id: string) => void;
  activeAccount: Account | null;
  addAccount: (account: Omit<Account, 'id' | 'currentBalance'>) => void;
  updateAccount: (id: string, account: Partial<Omit<Account, 'currentBalance'>>) => void;
  deleteAccount: (id: string) => void;

  // Date Range Filter
  dateRangeFilter: DateRangeFilter;
  setDateRangeFilter: (filter: DateRangeFilter) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Trades
  trades: Trade[];
  filteredTrades: Trade[];
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTrade: (idOrTrade: string | Trade, tradeFields?: Partial<Trade>) => Promise<void>;
  duplicateTrade: (tradeId: string) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  resetDemoData: () => Promise<void>;

  // Strategies & Tags
  strategies: Strategy[];
  addStrategy: (strategy: Omit<Strategy, 'id'>) => void;
  updateStrategy: (id: string, strategy: Partial<Strategy>) => void;
  deleteStrategy: (id: string) => void;
  tags: Tag[];
  addTag: (tag: Omit<Tag, 'id'>) => void;
  deleteTag: (id: string) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;

  // Export, Import & Reset Data
  exportDataJSON: () => void;
  exportDataCSV: () => void;
  importDataJSON: (jsonContent: string) => boolean;
  resetToDemoData: () => Promise<void>;

  // Modals & UI State
  isAddTradeOpen: boolean;
  setIsAddTradeOpen: (open: boolean) => void;
  editingTrade: Trade | null;
  setEditingTrade: (trade: Trade | null) => void;
  selectedTradeDetail: Trade | null;
  setSelectedTradeDetail: (trade: Trade | null) => void;

  // Calculated Stats
  dashboardStats: DashboardStats;
  equityCurveData: EquityCurvePoint[];
  strategyStats: StrategyPerformance[];
  pairStats: PairPerformance[];
  sessionStats: SessionPerformance[];
  dayOfWeekStats: DayOfWeekPerformance[];
  newsStats: NewsPerformance[];

  // Save state
  isSaving: boolean;

  // Toast feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

// ── Realtime Database helpers ─────────────────────────────────────────────────

/** Upload a screenshot using universal upload endpoint (Cloudinary / server storage fallback) */
async function uploadScreenshot(
  userId: string,
  tradeId: string,
  screenshot: TradeScreenshot,
  settings?: UserSettings
): Promise<TradeScreenshot> {
  if (!screenshot.url) return screenshot;
  
  // If already a permanent URL (like /uploads/... or https://res.cloudinary.com/...)
  if (!screenshot.url.startsWith('data:')) {
    return screenshot;
  }

  // Upload to universal upload endpoint
  try {
    const permanentUrl = await uploadScreenshotImage(
      screenshot.url,
      settings?.cloudinaryCloudName,
      settings?.cloudinaryUploadPreset,
      settings?.cloudinaryApiKey,
      settings?.cloudinaryApiSecret
    );
    return { ...screenshot, url: permanentUrl, storagePath: undefined };
  } catch (err) {
    console.warn('Screenshot upload error, keeping local base64:', err);
    return screenshot;
  }
}

/** Delete a screenshot from Firebase Storage (best-effort) */
async function deleteStorageFile(storagePath: string) {
  try {
    await deleteObject(storageRef(storage, storagePath));
  } catch {
    // File may not exist; ignore
  }
}

/** Strip undefined values before writing to Realtime Database */
function cleanForRealtimeDatabase<T extends object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const JournalProvider: React.FC<{ userId: string; children: ReactNode }> = ({ userId, children }) => {

  // ── UI / Navigation state ──────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [activeAccountId, setActiveAccountId] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState<boolean>(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [selectedTradeDetail, setSelectedTradeDetail] = useState<Trade | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Data state ─────────────────────────────────────────────────────────────
  // rawAccounts: stored in Realtime Database (no computed currentBalance)
  const [rawAccounts, setRawAccounts] = useState<Omit<Account, 'currentBalance'>[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((curr) => (curr === msg ? null : curr)), 3000);
  };

  // ── Theme ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
    }
  }, [settings.theme]);

  // ── Realtime Database listeners ────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    setDataLoading(true);
    const loaded = { accounts: false, trades: false, strategies: false, tags: false, settings: false };
    const checkDone = () => { if (Object.values(loaded).every(Boolean)) setDataLoading(false); };

    // Safety timeout: ensure loader clears within 2.5s regardless of network conditions
    const safetyTimeout = setTimeout(() => {
      setDataLoading(false);
    }, 2500);

    const unsubscribers: (() => void)[] = [];

    // Accounts
    unsubscribers.push(
      onSnapshot(collection(db, 'users', userId, 'accounts'), (snap) => {
        setRawAccounts(snap.docs.map((d) => d.data() as Omit<Account, 'currentBalance'>));
        if (!loaded.accounts) { loaded.accounts = true; checkDone(); }
      }, () => {
        if (!loaded.accounts) { loaded.accounts = true; checkDone(); }
      })
    );

    // Trades
    unsubscribers.push(
      onSnapshot(collection(db, 'users', userId, 'trades'), (snap) => {
        const incomingTrades = snap.docs.map((d) => d.data() as unknown as Trade);
        if (incomingTrades.length > 0) {
          setTrades(incomingTrades);
        } else {
          // If Firestore returns 0, do NOT overwrite if local state already has trades
          setTrades((prev) => (prev.length > 0 ? prev : []));
        }
        if (!loaded.trades) { loaded.trades = true; checkDone(); }
      }, () => {
        if (!loaded.trades) { loaded.trades = true; checkDone(); }
      })
    );

    // Strategies
    unsubscribers.push(
      onSnapshot(collection(db, 'users', userId, 'strategies'), (snap) => {
        setStrategies(snap.docs.map((d) => d.data() as unknown as Strategy));
        if (!loaded.strategies) { loaded.strategies = true; checkDone(); }
      }, () => {
        if (!loaded.strategies) { loaded.strategies = true; checkDone(); }
      })
    );

    // Tags
    unsubscribers.push(
      onSnapshot(collection(db, 'users', userId, 'tags'), (snap) => {
        setTags(snap.docs.map((d) => d.data() as unknown as Tag));
        if (!loaded.tags) { loaded.tags = true; checkDone(); }
      }, () => {
        if (!loaded.tags) { loaded.tags = true; checkDone(); }
      })
    );

    // Settings
    unsubscribers.push(
      onSnapshot(doc(db, 'users', userId, 'settings', 'preferences'), (snap) => {
        if (snap.exists()) {
          setSettings(snap.data() as unknown as UserSettings);
        }
        if (!loaded.settings) { loaded.settings = true; checkDone(); }
      }, () => {
        if (!loaded.settings) { loaded.settings = true; checkDone(); }
      })
    );

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribers.forEach((u) => u());
      setDataLoading(true);
    };
  }, [userId]);

  // ── Seed default data & check backups for user ─────────────────────────────
  useEffect(() => {
    if (dataLoading || !userId) return;

    (async () => {
      // Accounts: seed if empty
      const accSnap = await getDocs(collection(db, 'users', userId, 'accounts'));
      if (accSnap.empty) {
        await Promise.all(
          initialAccounts.map((acc) => {
            const { currentBalance: _cb, ...rest } = acc as Account;
            return setDoc(doc(db, 'users', userId, 'accounts', acc.id), rest);
          })
        );
      }

      // Strategies: seed if empty
      const stratSnap = await getDocs(collection(db, 'users', userId, 'strategies'));
      if (stratSnap.empty) {
        await Promise.all(
          initialStrategies.map((s) => setDoc(doc(db, 'users', userId, 'strategies', s.id), s))
        );
      }

      // Tags: seed if empty
      const tagSnap = await getDocs(collection(db, 'users', userId, 'tags'));
      if (tagSnap.empty) {
        await Promise.all(
          initialTags.map((t) => setDoc(doc(db, 'users', userId, 'tags', t.id), t))
        );
      }

      // Settings: seed if doc doesn't exist
      const settSnap = await getDocs(collection(db, 'users', userId, 'settings'));
      if (settSnap.empty) {
        await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), initialSettings);
      }

      // ── Trade Resilience & Migration:
      // If the current user has 0 trades, check if trades exist in:
      // 1) Guest/default localStorage cache
      // 2) Server /api/data persistence file
      const tradeSnap = await getDocs(collection(db, 'users', userId, 'trades'));
      if (tradeSnap.empty && trades.length === 0) {
        // Check default guest store
        try {
          const guestRaw = localStorage.getItem('tj_store_users/e0xW3T8S83Y8ATyma1keIe0fNX03/trades');
          if (guestRaw) {
            const guestTradesMap = JSON.parse(guestRaw);
            const guestTradesList = (Object.values(guestTradesMap) as Trade[]).filter((t) => t && t.id);
            if (guestTradesList.length > 0) {
              for (const tr of guestTradesList) {
                const migrated = { ...tr, userId };
                await setDoc(doc(db, 'users', userId, 'trades', tr.id), migrated);
              }
              setTrades(guestTradesList.map((t) => ({ ...t, userId })));
              return;
            }
          }
        } catch {
          // ignore
        }

        // Check server backup /api/data
        try {
          const res = await fetch('/api/data');
          if (res.ok) {
            const serverData = await res.json();
            if (Array.isArray(serverData.trades) && serverData.trades.length > 0) {
              for (const tr of serverData.trades) {
                const imported = { ...tr, userId };
                await setDoc(doc(db, 'users', userId, 'trades', tr.id), imported);
              }
              setTrades(serverData.trades.map((t: any) => ({ ...t, userId })));
            }
          }
        } catch {
          // ignore
        }
      }
    })();
  }, [dataLoading, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-backup to server file store whenever data updates ───────────────────
  useEffect(() => {
    if (trades.length === 0 && rawAccounts.length === 0) return;
    const timer = setTimeout(() => {
      fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trades,
          accounts: rawAccounts,
          strategies,
          tags,
          settings,
        }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [trades, rawAccounts, strategies, tags, settings]);

  // ── Computed accounts (with currentBalance derived from trades) ─────────────
  const accounts: Account[] = useMemo(() => {
    return rawAccounts.map((acc) => {
      const accTrades = trades.filter((t) => t.accountId === acc.id);
      const totalNetPL = accTrades.reduce((sum, t) => {
        const pl = typeof t.netPL === 'number' ? t.netPL : parseFloat(t.netPL as any) || 0;
        return sum + pl;
      }, 0);
      return {
        ...acc,
        currentBalance: Number(((acc.startingBalance || 0) + totalNetPL).toFixed(2)),
      };
    });
  }, [rawAccounts, trades]);

  const activeAccount = useMemo(() => {
    if (activeAccountId === 'all') return null;
    return accounts.find((a) => a.id === activeAccountId) || null;
  }, [accounts, activeAccountId]);

  // ── Filtered & sorted trades ───────────────────────────────────────────────
  const filteredTrades = useMemo(() => {
    let result = [...trades];

    if (activeAccountId !== 'all') {
      result = result.filter((t) => t.accountId === activeAccountId);
    }

    result = filterTradesByDateRange(result, dateRangeFilter, customStartDate, customEndDate);

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const stratName = strategies.find((s) => s.id === t.strategyId)?.name || '';
        return (
          t.symbol.toLowerCase().includes(q) ||
          t.setup.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          t.outcome.toLowerCase().includes(q) ||
          t.direction.toLowerCase().includes(q) ||
          stratName.toLowerCase().includes(q) ||
          t.tags.some((tg) => tg.toLowerCase().includes(q)) ||
          (t.news?.newsEvent && t.news.newsEvent.toLowerCase().includes(q))
        );
      });
    }

    return result.sort((a, b) => {
      const dtA = `${a.date} ${a.time || '00:00'}`;
      const dtB = `${b.date} ${b.time || '00:00'}`;
      return dtB.localeCompare(dtA);
    });
  }, [trades, activeAccountId, dateRangeFilter, customStartDate, customEndDate, searchQuery, strategies]);

  // ── Memoized analytics ─────────────────────────────────────────────────────
  const dashboardStats = useMemo(() => calculateDashboardStats(filteredTrades, activeAccount), [filteredTrades, activeAccount]);

  const equityCurveData = useMemo(() => {
    const startBal = activeAccount
      ? activeAccount.startingBalance
      : rawAccounts.reduce((acc, a) => acc + (a.startingBalance || 0), 0);
    return calculateEquityCurve(filteredTrades, startBal);
  }, [filteredTrades, activeAccount, rawAccounts]);

  const strategyStats = useMemo(() => calculateStrategyStats(filteredTrades, strategies), [filteredTrades, strategies]);
  const pairStats = useMemo(() => calculatePairStats(filteredTrades), [filteredTrades]);
  const sessionStats = useMemo(() => calculateSessionStats(filteredTrades), [filteredTrades]);
  const dayOfWeekStats = useMemo(() => calculateDayOfWeekStats(filteredTrades), [filteredTrades]);
  const newsStats = useMemo(() => calculateNewsStats(filteredTrades), [filteredTrades]);

  // ── CRUD: Trades ───────────────────────────────────────────────────────────

  const addTrade = async (tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nowISO = new Date().toISOString();
    const tradeId = `trd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setIsSaving(true);
    showToast('Saving…');

    try {
      // 1. Upload any base64 screenshots to server storage / Cloudinary
      const processedScreenshots = await Promise.all(
        (tradeData.screenshots || []).map((s) => uploadScreenshot(userId, tradeId, s, settings))
      );

      const netPL = typeof tradeData.netPL === 'number' ? tradeData.netPL : parseFloat(tradeData.netPL as any) || 0;
      const commission = typeof tradeData.commission === 'number' ? tradeData.commission : parseFloat(tradeData.commission as any) || 0;
      const fees = typeof tradeData.fees === 'number' ? tradeData.fees : parseFloat(tradeData.fees as any) || 0;
      const grossPL = tradeData.grossPL !== undefined ? Number(tradeData.grossPL) : Number((netPL + commission + fees).toFixed(2));

      const newTrade: Trade = cleanForRealtimeDatabase({
        ...tradeData,
        netPL,
        grossPL,
        commission,
        fees,
        entry: Number(tradeData.entry) || 0,
        stopLoss: Number(tradeData.stopLoss) || 0,
        takeProfit: Number(tradeData.takeProfit) || 0,
        exitPrice: Number(tradeData.exitPrice) || 0,
        lotSize: Number(tradeData.lotSize) || 0,
        riskPercent: Number(tradeData.riskPercent) || 1.0,
        riskAmount: Number(tradeData.riskAmount) || 0,
        plannedRR: Number(tradeData.plannedRR) || 0,
        realizedRR: Number(tradeData.realizedRR) || 0,
        screenshots: processedScreenshots,
        id: tradeId,
        userId,
        createdAt: nowISO,
        updatedAt: nowISO,
      });

      // Optimistically update in-memory state instantly so P&L and balance reflect immediately
      setTrades((prev) => [newTrade, ...prev.filter((t) => t.id !== tradeId)]);

      // Save to database
      await setDoc(doc(db, 'users', userId, 'trades', tradeId), newTrade);

      // Also sync to server backup endpoint
      fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrade),
      }).catch((e) => console.warn('Server trade sync notice:', e));

      showToast('✓ Trade saved');
    } catch (err) {
      console.error('Failed to save trade:', err);
      showToast('Unable to save trade. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateTrade = async (idOrTrade: string | Trade, updatedFields?: Partial<Trade>) => {
    const id = typeof idOrTrade === 'string' ? idOrTrade : idOrTrade?.id;
    if (!id) {
      console.error('Cannot update trade without valid ID');
      return;
    }
    const fields = typeof idOrTrade === 'string' ? (updatedFields || {}) : idOrTrade;
    const nowISO = new Date().toISOString();
    const existing = trades.find((t) => t.id === id);
    setIsSaving(true);
    showToast('Saving changes…');

    try {
      // Upload any new base64 screenshots
      let screenshots = fields?.screenshots ?? existing?.screenshots ?? [];
      screenshots = await Promise.all(
        screenshots.map((s) => uploadScreenshot(userId, id, s, settings))
      );

      const netPL = fields?.netPL !== undefined
        ? (typeof fields.netPL === 'number' ? fields.netPL : parseFloat(fields.netPL as any) || 0)
        : (existing?.netPL || 0);

      const updated = cleanForRealtimeDatabase({
        ...(existing || {}),
        ...fields,
        netPL,
        screenshots,
        id,
        userId,
        updatedAt: nowISO,
      });

      // Optimistically update state
      setTrades((prev) => prev.map((t) => (t.id === id ? updated : t)));

      await setDoc(doc(db, 'users', userId, 'trades', id), updated, { merge: true });

      fetch(`/api/trades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch((e) => console.warn('Server trade update sync notice:', e));

      showToast('✓ Changes saved');
    } catch (err) {
      console.error('Failed to update trade:', err);
      showToast('Unable to update trade. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const duplicateTrade = async (tradeId: string) => {
    const original = trades.find((t) => t.id === tradeId);
    if (!original) return;
    const nowISO = new Date().toISOString();
    const newId = `trd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const newTrade: Trade = cleanForRealtimeDatabase({
      ...original,
      id: newId,
      userId,
      date: nowISO.split('T')[0],
      notes: `[Duplicate] ${original.notes || ''}`,
      screenshots: original.screenshots || [],
      createdAt: nowISO,
      updatedAt: nowISO,
    });

    setTrades((prev) => [newTrade, ...prev.filter((t) => t.id !== newId)]);

    try {
      await setDoc(doc(db, 'users', userId, 'trades', newId), newTrade);
      showToast('Trade duplicated');
    } catch (err) {
      console.error('Failed to duplicate trade:', err);
      showToast('Unable to duplicate trade.');
    }
  };

  const deleteTrade = async (id: string) => {
    const trade = trades.find((t) => t.id === id);
    if (selectedTradeDetail?.id === id) setSelectedTradeDetail(null);

    // Optimistically remove from state
    setTrades((prev) => prev.filter((t) => t.id !== id));

    showToast('Deleting…');

    try {
      await deleteDoc(doc(db, 'users', userId, 'trades', id));

      fetch(`/api/trades/${id}`, { method: 'DELETE' }).catch(() => {});

      if (trade?.screenshots) {
        await Promise.all(
          trade.screenshots
            .filter((s) => s.storagePath)
            .map((s) => deleteStorageFile(s.storagePath!))
        );
      }
      showToast('✓ Trade deleted');
    } catch (err) {
      console.error('Failed to delete trade:', err);
      showToast('Unable to delete trade. Please try again.');
    }
  };

  const resetDemoData = async () => {
    try {
      // Delete all existing trades (and their screenshots)
      const tradeSnap = await getDocs(collection(db, 'users', userId, 'trades'));
      await Promise.all(
        tradeSnap.docs.map(async (d) => {
          const trade = d.data() as unknown as Trade;
          if (trade.screenshots) {
            await Promise.all(
              trade.screenshots.filter((s) => s.storagePath).map((s) => deleteStorageFile(s.storagePath!))
            );
          }
          await deleteDoc(d.ref);
        })
      );

      // Re-seed accounts, strategies, tags
      await Promise.all([
        ...initialAccounts.map((acc) => {
          const { currentBalance: _cb, ...rest } = acc as Account;
          return setDoc(doc(db, 'users', userId, 'accounts', acc.id), rest);
        }),
        ...initialStrategies.map((s) => setDoc(doc(db, 'users', userId, 'strategies', s.id), s)),
        ...initialTags.map((t) => setDoc(doc(db, 'users', userId, 'tags', t.id), t)),
        setDoc(doc(db, 'users', userId, 'settings', 'preferences'), initialSettings),
      ]);

      setActiveAccountId('all');
      setDateRangeFilter('all');
      setSearchQuery('');
      showToast('Journal reset. Ready for your live trades!');
    } catch (err) {
      console.error('Failed to reset data:', err);
      showToast('Reset failed. Please try again.');
    }
  };

  // ── CRUD: Accounts ─────────────────────────────────────────────────────────

  const addAccount = (acc: Omit<Account, 'id' | 'currentBalance'>) => {
    const newAcc = { ...acc, id: `acc_${Date.now()}` };
    setDoc(doc(db, 'users', userId, 'accounts', newAcc.id), newAcc)
      .then(() => showToast('Trading account added'))
      .catch(() => showToast('Failed to add account.'));
  };

  const updateAccount = (id: string, fields: Partial<Omit<Account, 'currentBalance'>>) => {
    const existing = rawAccounts.find((a) => a.id === id);
    if (!existing) return;
    const updated = { ...existing, ...fields };
    setDoc(doc(db, 'users', userId, 'accounts', id), updated, { merge: true })
      .then(() => showToast('Account updated'))
      .catch(() => showToast('Failed to update account.'));
  };

  const deleteAccount = (id: string) => {
    deleteDoc(doc(db, 'users', userId, 'accounts', id))
      .then(() => {
        if (activeAccountId === id) setActiveAccountId('all');
        showToast('Account deleted');
      })
      .catch(() => showToast('Failed to delete account.'));
  };

  // ── CRUD: Strategies ───────────────────────────────────────────────────────

  const addStrategy = (strat: Omit<Strategy, 'id'>) => {
    const newStrat = { ...strat, id: `strat_${Date.now()}` };
    setDoc(doc(db, 'users', userId, 'strategies', newStrat.id), newStrat)
      .then(() => showToast('Strategy created'))
      .catch(() => showToast('Failed to create strategy.'));
  };

  const updateStrategy = (id: string, fields: Partial<Strategy>) => {
    setDoc(doc(db, 'users', userId, 'strategies', id), fields, { merge: true })
      .then(() => showToast('Strategy updated'))
      .catch(() => showToast('Failed to update strategy.'));
  };

  const deleteStrategy = (id: string) => {
    deleteDoc(doc(db, 'users', userId, 'strategies', id))
      .then(() => showToast('Strategy removed'))
      .catch(() => showToast('Failed to delete strategy.'));
  };

  // ── CRUD: Tags ─────────────────────────────────────────────────────────────

  const addTag = (tg: Omit<Tag, 'id'>) => {
    const newTag = { ...tg, id: `tag_${Date.now()}` };
    setDoc(doc(db, 'users', userId, 'tags', newTag.id), newTag)
      .then(() => showToast('Tag created'))
      .catch(() => showToast('Failed to create tag.'));
  };

  const deleteTag = (id: string) => {
    deleteDoc(doc(db, 'users', userId, 'tags', id))
      .then(() => showToast('Tag removed'))
      .catch(() => showToast('Failed to delete tag.'));
  };

  // ── CRUD: Settings ─────────────────────────────────────────────────────────

  const updateSettings = (newSetts: Partial<UserSettings>) => {
    const merged = { ...settings, ...newSetts };
    setSettings(merged);
    setDoc(doc(db, 'users', userId, 'settings', 'preferences'), merged)
      .then(() => showToast('Settings saved'))
      .catch(() => showToast('Failed to save settings.'));
  };

  // ── Export, Import & Reset Data ─────────────────────────────────────────────

  const exportDataJSON = () => {
    try {
      const backupData = {
        accounts: rawAccounts.length > 0 ? rawAccounts : accounts,
        trades,
        strategies,
        tags,
        settings,
        exportDate: new Date().toISOString(),
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `trading-journal-backup-${dateStr}.json`;

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('✓ JSON backup exported');
    } catch (err) {
      console.error('Failed to export JSON backup:', err);
      showToast('Failed to export backup.');
    }
  };

  const exportDataCSV = () => {
    try {
      const headers = [
        'date',
        'time',
        'symbol',
        'direction',
        'session',
        'setup',
        'entry',
        'stopLoss',
        'takeProfit',
        'exitPrice',
        'lotSize',
        'riskPercent',
        'riskAmount',
        'plannedRR',
        'realizedRR',
        'grossPL',
        'commission',
        'fees',
        'netPL',
        'outcome',
        'notes',
      ];

      const escapeCSV = (val: any): string => {
        if (val === undefined || val === null) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = trades.map((t) => [
        t.date || '',
        t.time || '',
        t.symbol || '',
        t.direction || '',
        t.session || '',
        t.setup || '',
        t.entry ?? '',
        t.stopLoss ?? '',
        t.takeProfit ?? '',
        t.exitPrice ?? '',
        t.lotSize ?? '',
        t.riskPercent ?? '',
        t.riskAmount ?? '',
        t.plannedRR ?? '',
        t.realizedRR ?? '',
        t.grossPL ?? '',
        t.commission ?? '',
        t.fees ?? '',
        t.netPL ?? '',
        t.outcome || '',
        t.notes || '',
      ].map(escapeCSV).join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `trading-journal-trades-${dateStr}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('✓ Trades CSV exported');
    } catch (err) {
      console.error('Failed to export CSV trades:', err);
      showToast('Failed to export CSV.');
    }
  };

  const importDataJSON = (jsonContent: string): boolean => {
    try {
      if (!jsonContent || typeof jsonContent !== 'string') {
        return false;
      }
      const data = JSON.parse(jsonContent);
      if (!data || typeof data !== 'object') {
        return false;
      }

      if (!Array.isArray(data.trades) || !Array.isArray(data.accounts) || !data.settings) {
        return false;
      }

      const importedAccounts = data.accounts as Account[];
      const importedTrades = data.trades as Trade[];
      const importedStrategies = (Array.isArray(data.strategies) ? data.strategies : []) as Strategy[];
      const importedTags = (Array.isArray(data.tags) ? data.tags : []) as Tag[];
      const importedSettings = (data.settings || initialSettings) as UserSettings;

      // Update in-memory state immediately
      setRawAccounts(importedAccounts.map((a: any) => {
        const { currentBalance, ...rest } = a;
        return rest;
      }));
      setTrades(importedTrades);
      setStrategies(importedStrategies);
      setTags(importedTags);
      setSettings(importedSettings);

      // Write each collection back to Firestore under users/{userId}/...
      if (userId) {
        (async () => {
          try {
            // Write accounts
            for (const acc of importedAccounts) {
              const { currentBalance, ...rest } = acc;
              await setDoc(doc(db, 'users', userId, 'accounts', acc.id), rest);
            }
            // Write trades
            for (const tr of importedTrades) {
              await setDoc(doc(db, 'users', userId, 'trades', tr.id), tr);
            }
            // Write strategies
            for (const st of importedStrategies) {
              await setDoc(doc(db, 'users', userId, 'strategies', st.id), st);
            }
            // Write tags
            for (const tg of importedTags) {
              await setDoc(doc(db, 'users', userId, 'tags', tg.id), tg);
            }
            // Write settings
            await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), importedSettings);
          } catch (e) {
            console.error('Error writing imported data to Firestore:', e);
          }
        })();
      }

      showToast('✓ Journal data imported successfully');
      return true;
    } catch (err) {
      console.error('Failed to parse or import JSON:', err);
      return false;
    }
  };

  const resetToDemoData = async () => {
    return resetDemoData();
  };

  // ── Provider value ─────────────────────────────────────────────────────────

  return (
    <JournalContext.Provider
      value={{
        dataLoading,
        currentPage,
        setCurrentPage,
        accounts,
        activeAccountId,
        setActiveAccountId,
        activeAccount,
        addAccount,
        updateAccount,
        deleteAccount,
        dateRangeFilter,
        setDateRangeFilter,
        customStartDate,
        setCustomStartDate,
        customEndDate,
        setCustomEndDate,
        searchQuery,
        setSearchQuery,
        isSearchOpen,
        setIsSearchOpen,
        trades,
        filteredTrades,
        addTrade,
        updateTrade,
        duplicateTrade,
        deleteTrade,
        resetDemoData,
        resetToDemoData,
        exportDataJSON,
        exportDataCSV,
        importDataJSON,
        strategies,
        addStrategy,
        updateStrategy,
        deleteStrategy,
        tags,
        addTag,
        deleteTag,
        settings,
        updateSettings,
        isAddTradeOpen,
        setIsAddTradeOpen,
        editingTrade,
        setEditingTrade,
        selectedTradeDetail,
        setSelectedTradeDetail,
        dashboardStats,
        equityCurveData,
        strategyStats,
        pairStats,
        sessionStats,
        dayOfWeekStats,
        newsStats,
        isSaving,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error('useJournal must be used within a JournalProvider');
  return ctx;
};
