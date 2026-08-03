import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
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
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<void>;
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

// ── Firestore helpers ─────────────────────────────────────────────────────────

/** Upload a base64 screenshot to Firebase Storage; returns updated screenshot with permanent URL */
async function uploadScreenshot(userId: string, tradeId: string, screenshot: TradeScreenshot): Promise<TradeScreenshot> {
  if (!screenshot.url.startsWith('data:')) return screenshot; // already a permanent URL
  const path = `users/${userId}/trades/${tradeId}/${screenshot.id}`;
  const sRef = storageRef(storage, path);
  await uploadString(sRef, screenshot.url, 'data_url');
  const downloadURL = await getDownloadURL(sRef);
  return { ...screenshot, url: downloadURL, storagePath: path };
}

/** Delete a screenshot from Firebase Storage (best-effort) */
async function deleteStorageFile(storagePath: string) {
  try {
    await deleteObject(storageRef(storage, storagePath));
  } catch {
    // File may not exist; ignore
  }
}

/** Strip undefined values (Firestore rejects them) */
function cleanForFirestore<T extends object>(obj: T): T {
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
  // rawAccounts: stored in Firestore (no computed currentBalance)
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

  // ── Firestore real-time listeners ──────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    setDataLoading(true);
    const loaded = { accounts: false, trades: false, strategies: false, tags: false, settings: false };
    const checkDone = () => { if (Object.values(loaded).every(Boolean)) setDataLoading(false); };

    const unsubscribers: (() => void)[] = [];

    // Accounts
    unsubscribers.push(
      onSnapshot(collection(db, 'users', userId, 'accounts'), (snap) => {
        setRawAccounts(snap.docs.map((d) => d.data() as Omit<Account, 'currentBalance'>));
        if (!loaded.accounts) { loaded.accounts = true; checkDone(); }
      })
    );

    // Trades
    unsubscribers.push(
      onSnapshot(collection(db, 'users', userId, 'trades'), (snap) => {
        setTrades(snap.docs.map((d) => d.data() as Trade));
        if (!loaded.trades) { loaded.trades = true; checkDone(); }
      })
    );

    // Strategies
    unsubscribers.push(
      onSnapshot(collection(db, 'users', userId, 'strategies'), (snap) => {
        setStrategies(snap.docs.map((d) => d.data() as Strategy));
        if (!loaded.strategies) { loaded.strategies = true; checkDone(); }
      })
    );

    // Tags
    unsubscribers.push(
      onSnapshot(collection(db, 'users', userId, 'tags'), (snap) => {
        setTags(snap.docs.map((d) => d.data() as Tag));
        if (!loaded.tags) { loaded.tags = true; checkDone(); }
      })
    );

    // Settings
    unsubscribers.push(
      onSnapshot(doc(db, 'users', userId, 'settings', 'preferences'), (snap) => {
        if (snap.exists()) {
          setSettings(snap.data() as UserSettings);
        }
        if (!loaded.settings) { loaded.settings = true; checkDone(); }
      })
    );

    return () => {
      unsubscribers.forEach((u) => u());
      setDataLoading(true);
    };
  }, [userId]);

  // ── Seed default data for new users (after first load) ────────────────────
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
    })();
  }, [dataLoading, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Computed accounts (with currentBalance derived from trades) ─────────────
  const accounts: Account[] = useMemo(() => {
    return rawAccounts.map((acc) => {
      const accTrades = trades.filter((t) => t.accountId === acc.id);
      const totalNetPL = accTrades.reduce((sum, t) => sum + (t.netPL || 0), 0);
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
      // Upload any base64 screenshots to Firebase Storage first
      const processedScreenshots = await Promise.all(
        (tradeData.screenshots || []).map((s) => uploadScreenshot(userId, tradeId, s))
      );

      const newTrade: Trade = cleanForFirestore({
        ...tradeData,
        screenshots: processedScreenshots,
        id: tradeId,
        userId,
        createdAt: nowISO,
        updatedAt: nowISO,
      });

      await setDoc(doc(db, 'users', userId, 'trades', tradeId), newTrade);
      showToast('✓ Trade saved');
    } catch (err) {
      console.error('Failed to save trade:', err);
      showToast('Unable to save trade. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateTrade = async (id: string, updatedFields: Partial<Trade>) => {
    const nowISO = new Date().toISOString();
    const existing = trades.find((t) => t.id === id);
    setIsSaving(true);
    showToast('Saving changes…');

    try {
      // Upload any new base64 screenshots
      let screenshots = updatedFields.screenshots ?? existing?.screenshots ?? [];
      screenshots = await Promise.all(
        screenshots.map((s) => uploadScreenshot(userId, id, s))
      );

      const updated = cleanForFirestore({
        ...(existing || {}),
        ...updatedFields,
        screenshots,
        id,
        userId,
        updatedAt: nowISO,
      });

      await setDoc(doc(db, 'users', userId, 'trades', id), updated, { merge: true });
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

    // Duplicate without Storage screenshots (avoid re-uploading)
    const newTrade: Trade = cleanForFirestore({
      ...original,
      id: newId,
      userId,
      date: nowISO.split('T')[0],
      notes: `[Duplicate] ${original.notes}`,
      screenshots: [], // Don't copy screenshots to avoid Storage duplication
      createdAt: nowISO,
      updatedAt: nowISO,
    });

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

    showToast('Deleting…');

    try {
      // Delete Firestore document
      await deleteDoc(doc(db, 'users', userId, 'trades', id));

      // Delete associated screenshots from Storage
      if (trade?.screenshots) {
        await Promise.all(
          trade.screenshots
            .filter((s) => s.storagePath)
            .map((s) => deleteStorageFile(s.storagePath!))
        );
      }

      showToast('Trade deleted');
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
          const trade = d.data() as Trade;
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
