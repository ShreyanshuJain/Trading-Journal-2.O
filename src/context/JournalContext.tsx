import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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
} from '../types';
import {
  initialAccounts,
  initialStrategies,
  initialTags,
  initialSettings,
  initialTrades,
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
  // Navigation
  currentPage: NavigationPage;
  setCurrentPage: (page: NavigationPage) => void;

  // Accounts
  accounts: Account[];
  activeAccountId: string; // 'all' or specific account id
  setActiveAccountId: (id: string) => void;
  activeAccount: Account | null;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
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
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTrade: (id: string, trade: Partial<Trade>) => void;
  duplicateTrade: (tradeId: string) => void;
  deleteTrade: (id: string) => void;
  resetDemoData: () => void;

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

  // Toast feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_TRADES = 'trading_journal_trades_v1';
const LOCAL_STORAGE_KEY_ACCOUNTS = 'trading_journal_accounts_v1';
const LOCAL_STORAGE_KEY_STRATEGIES = 'trading_journal_strategies_v1';
const LOCAL_STORAGE_KEY_TAGS = 'trading_journal_tags_v1';
const LOCAL_STORAGE_KEY_SETTINGS = 'trading_journal_settings_v1';

export const JournalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');

  // Accounts state
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ACCOUNTS);
      return saved ? JSON.parse(saved) : initialAccounts;
    } catch {
      return initialAccounts;
    }
  });

  const [activeAccountId, setActiveAccountId] = useState<string>('all');

  // Strategies state
  const [strategies, setStrategies] = useState<Strategy[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_STRATEGIES);
      return saved ? JSON.parse(saved) : initialStrategies;
    } catch {
      return initialStrategies;
    }
  });

  // Tags state
  const [tags, setTags] = useState<Tag[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TAGS);
      return saved ? JSON.parse(saved) : initialTags;
    } catch {
      return initialTags;
    }
  });

  // Settings state
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : initialSettings;
    } catch {
      return initialSettings;
    }
  });

  // Apply theme class to document
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
    }
  }, [settings.theme]);

  // Trades state
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TRADES);
      return saved ? JSON.parse(saved) : initialTrades;
    } catch {
      return initialTrades;
    }
  });

  // Filters & Search
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Modals & UI Selection
  const [isAddTradeOpen, setIsAddTradeOpen] = useState<boolean>(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [selectedTradeDetail, setSelectedTradeDetail] = useState<Trade | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // Initial backend fetch
  useEffect(() => {
    async function loadBackendData() {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            if (Array.isArray(data.trades)) {
              setTrades(data.trades);
              localStorage.setItem(LOCAL_STORAGE_KEY_TRADES, JSON.stringify(data.trades));
            }
            if (Array.isArray(data.accounts) && data.accounts.length > 0) {
              setAccounts(data.accounts);
            }
            if (Array.isArray(data.strategies) && data.strategies.length > 0) {
              setStrategies(data.strategies);
            }
            if (Array.isArray(data.tags) && data.tags.length > 0) {
              setTags(data.tags);
            }
            if (data.settings && typeof data.settings === 'object') {
              setSettings((prev) => ({ ...prev, ...data.settings }));
            }
          }
        }
      } catch (e) {
        console.warn('Backend fetch failed, using local storage cache', e);
      }
    }
    loadBackendData();
  }, []);

  // Sync state to local storage and backend
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_TRADES, JSON.stringify(trades));
      fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades, accounts, strategies, tags, settings }),
      }).catch(() => {});
    } catch (e) {
      console.error('Error saving trades', e);
    }
  }, [trades, accounts, strategies, tags, settings]);

  // Active account
  const activeAccount = useMemo(() => {
    if (activeAccountId === 'all') return null;
    return accounts.find((a) => a.id === activeAccountId) || null;
  }, [accounts, activeAccountId]);

  // Recalculate account balances based on trades
  useEffect(() => {
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        const accTrades = trades.filter((t) => t.accountId === acc.id);
        const totalNetPL = accTrades.reduce((sum, t) => sum + t.netPL, 0);
        return {
          ...acc,
          currentBalance: Number((acc.startingBalance + totalNetPL).toFixed(2)),
        };
      })
    );
  }, [trades]);

  // Master Filtered Trades
  const filteredTrades = useMemo(() => {
    let result = [...trades];

    // Filter by Account
    if (activeAccountId !== 'all') {
      result = result.filter((t) => t.accountId === activeAccountId);
    }

    // Filter by Date Range
    result = filterTradesByDateRange(result, dateRangeFilter, customStartDate, customEndDate);

    // Filter by Search Query
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

    // Sort descending by date & time
    return result.sort((a, b) => {
      const dtA = `${a.date} ${a.time || '00:00'}`;
      const dtB = `${b.date} ${b.time || '00:00'}`;
      return dtB.localeCompare(dtA);
    });
  }, [trades, activeAccountId, dateRangeFilter, customStartDate, customEndDate, searchQuery, strategies]);

  // Statistics memoization
  const dashboardStats = useMemo(() => {
    return calculateDashboardStats(filteredTrades, activeAccount);
  }, [filteredTrades, activeAccount]);

  const equityCurveData = useMemo(() => {
    const startBal = activeAccount
      ? activeAccount.startingBalance
      : accounts.reduce((acc, a) => acc + a.startingBalance, 0);
    return calculateEquityCurve(filteredTrades, startBal);
  }, [filteredTrades, activeAccount, accounts]);

  const strategyStats = useMemo(() => {
    return calculateStrategyStats(filteredTrades, strategies);
  }, [filteredTrades, strategies]);

  const pairStats = useMemo(() => {
    return calculatePairStats(filteredTrades);
  }, [filteredTrades]);

  const sessionStats = useMemo(() => {
    return calculateSessionStats(filteredTrades);
  }, [filteredTrades]);

  const dayOfWeekStats = useMemo(() => {
    return calculateDayOfWeekStats(filteredTrades);
  }, [filteredTrades]);

  const newsStats = useMemo(() => {
    return calculateNewsStats(filteredTrades);
  }, [filteredTrades]);

  // CRUD Actions
  const addTrade = (tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nowISO = new Date().toISOString();
    const newTrade: Trade = {
      ...tradeData,
      id: `trd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    setTrades((prev) => [newTrade, ...prev]);
    showToast('Trade recorded successfully');
  };

  const updateTrade = (id: string, updatedFields: Partial<Trade>) => {
    const nowISO = new Date().toISOString();
    setTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedFields, updatedAt: nowISO } : t))
    );
    showToast('Trade updated successfully');
  };

  const duplicateTrade = (tradeId: string) => {
    const original = trades.find((t) => t.id === tradeId);
    if (!original) return;
    const nowISO = new Date().toISOString();
    const todayStr = nowISO.split('T')[0];
    const newTrade: Trade = {
      ...original,
      id: `trd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: todayStr,
      notes: `[Duplicate] ${original.notes}`,
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    setTrades((prev) => [newTrade, ...prev]);
    showToast('Trade duplicated successfully');
  };

  const deleteTrade = (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
    if (selectedTradeDetail?.id === id) {
      setSelectedTradeDetail(null);
    }
    showToast('Trade deleted successfully');
  };

  const resetDemoData = () => {
    setTrades([]);
    setAccounts(initialAccounts);
    setStrategies(initialStrategies);
    setTags(initialTags);
    setSettings(initialSettings);
    setActiveAccountId('all');
    setDateRangeFilter('all');
    setSearchQuery('');
    localStorage.removeItem(LOCAL_STORAGE_KEY_TRADES);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ACCOUNTS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_STRATEGIES);
    localStorage.removeItem(LOCAL_STORAGE_KEY_TAGS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_SETTINGS);
    fetch('/api/data/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trades: [],
        accounts: initialAccounts,
        strategies: initialStrategies,
        tags: initialTags,
        settings: initialSettings,
      }),
    }).catch(() => {});
    showToast('All trade data reset cleanly. Ready for your live trades!');
  };

  const addAccount = (acc: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...acc,
      id: `acc_${Date.now()}`,
    };
    setAccounts((prev) => [...prev, newAcc]);
    showToast('Trading account added');
  };

  const updateAccount = (id: string, fields: Partial<Account>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...fields } : a)));
    showToast('Account updated');
  };

  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (activeAccountId === id) {
      setActiveAccountId('all');
    }
    showToast('Account deleted');
  };

  const addStrategy = (strat: Omit<Strategy, 'id'>) => {
    const newStrat: Strategy = {
      ...strat,
      id: `strat_${Date.now()}`,
    };
    setStrategies((prev) => [...prev, newStrat]);
    showToast('Strategy created');
  };

  const updateStrategy = (id: string, fields: Partial<Strategy>) => {
    setStrategies((prev) => prev.map((s) => (s.id === id ? { ...s, ...fields } : s)));
    showToast('Strategy updated');
  };

  const deleteStrategy = (id: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== id));
    showToast('Strategy removed');
  };

  const addTag = (tg: Omit<Tag, 'id'>) => {
    const newTag: Tag = {
      ...tg,
      id: `tag_${Date.now()}`,
    };
    setTags((prev) => [...prev, newTag]);
    showToast('Tag created');
  };

  const deleteTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    showToast('Tag removed');
  };

  const updateSettings = (newSetts: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSetts }));
    showToast('Settings saved');
  };

  return (
    <JournalContext.Provider
      value={{
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
  if (!ctx) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return ctx;
};
