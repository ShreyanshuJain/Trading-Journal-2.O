import React, { useState, useMemo } from 'react';
import { useJournal } from '../context/JournalContext';
import { HeaderBar } from './HeaderBar';
import { Trade, DateRangeFilter } from '../types';
import {
  HelpCircle,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Award,
  ShieldAlert,
  Calendar,
  Layers,
  Globe,
  Newspaper,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const {
    trades,
    filteredTrades,
    accounts,
    activeAccount,
    activeAccountId,
    setActiveAccountId,
    dateRangeFilter,
    setDateRangeFilter,
    dashboardStats,
    equityCurveData,
    strategyStats,
    pairStats,
    sessionStats,
    dayOfWeekStats,
    newsStats,
    setSelectedTradeDetail,
  } = useJournal();

  // Top navigation tabs: Overview (the exact UI in the screenshot) + analytical drill-downs
  const [activeTab, setActiveTab] = useState<'overview' | 'strategies' | 'pairs' | 'sessions' | 'days' | 'news'>('overview');
  const [tradeFilterType, setTradeFilterType] = useState<'all' | 'open' | 'closed'>('closed');
  const [isTradesExpanded, setIsTradesExpanded] = useState<boolean>(false);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState<boolean>(false);

  // ── Account & Equity Calculations ──────────────────────────────────────────
  const startingBalance = useMemo(() => {
    if (activeAccount) return activeAccount.startingBalance || 0;
    return accounts.reduce((sum, a) => sum + (a.startingBalance || 0), 0);
  }, [activeAccount, accounts]);

  const closedTrades = useMemo(() => {
    return filteredTrades.filter((t) => t.outcome !== 'OPEN');
  }, [filteredTrades]);

  const openTrades = useMemo(() => {
    return filteredTrades.filter((t) => t.outcome === 'OPEN');
  }, [filteredTrades]);

  const displayedTrades = useMemo(() => {
    if (tradeFilterType === 'open') return openTrades;
    if (tradeFilterType === 'closed') return closedTrades;
    return filteredTrades;
  }, [tradeFilterType, openTrades, closedTrades, filteredTrades]);

  // Current equity & closed balance
  const totalClosedPL = useMemo(() => {
    return closedTrades.reduce((sum, t) => sum + (Number(t.netPL) || 0), 0);
  }, [closedTrades]);

  const totalOpenPL = useMemo(() => {
    return openTrades.reduce((sum, t) => sum + (Number(t.netPL) || 0), 0);
  }, [openTrades]);

  const closedBalance = useMemo(() => {
    return Number((startingBalance + totalClosedPL).toFixed(2));
  }, [startingBalance, totalClosedPL]);

  const currentEquity = useMemo(() => {
    return Number((closedBalance + totalOpenPL).toFixed(2));
  }, [closedBalance, totalOpenPL]);

  const currentPeriodPL = useMemo(() => {
    return Number(dashboardStats.totalPL.toFixed(2));
  }, [dashboardStats.totalPL]);

  // High Water Mark (HWM) calculation
  const { hwm, pnlFromHwm, pnlFromHwmPercent } = useMemo(() => {
    let peak = startingBalance;
    let running = startingBalance;

    // Sort all trades chronologically to find all-time peak
    const chronTrades = [...trades].sort((a, b) => {
      const dtA = `${a.date} ${a.time || '00:00'}`;
      const dtB = `${b.date} ${b.time || '00:00'}`;
      return dtA.localeCompare(dtB);
    });

    chronTrades.forEach((t) => {
      running += Number(t.netPL) || 0;
      if (running > peak) peak = running;
    });

    const diff = Number((currentEquity - peak).toFixed(2));
    const diffPercent = peak > 0 ? Number(((diff / peak) * 100).toFixed(2)) : 0;

    return {
      hwm: Number(peak.toFixed(2)),
      pnlFromHwm: diff,
      pnlFromHwmPercent: diffPercent,
    };
  }, [startingBalance, trades, currentEquity]);

  // Fees calculation
  const totalFees = useMemo(() => {
    return displayedTrades.reduce((sum, t) => {
      const comm = Number(t.commission) || 0;
      const f = Number(t.fees) || 0;
      return sum + comm + f;
    }, 0);
  }, [displayedTrades]);

  // Win count for displayed trades
  const winCount = useMemo(() => {
    return displayedTrades.filter((t) => t.outcome === 'WIN' || (t.outcome === 'PARTIAL' && (Number(t.netPL) || 0) > 0)).length;
  }, [displayedTrades]);

  const displayedTotalPL = useMemo(() => {
    return displayedTrades.reduce((sum, t) => sum + (Number(t.netPL) || 0), 0);
  }, [displayedTrades]);

  // Avg Trade Size
  const avgTradeSize = useMemo(() => {
    if (displayedTrades.length === 0) return 0;
    const totalLots = displayedTrades.reduce((sum, t) => sum + (Number(t.lotSize) || 0), 0);
    return Number((totalLots / displayedTrades.length).toFixed(2));
  }, [displayedTrades]);

  // Biggest Loss
  const biggestLoss = useMemo(() => {
    const losses = displayedTrades
      .filter((t) => (Number(t.netPL) || 0) < 0)
      .map((t) => Math.abs(Number(t.netPL) || 0));
    if (losses.length === 0) return 0;
    return Number(Math.max(...losses).toFixed(2));
  }, [displayedTrades]);

  // Best Profit
  const bestProfit = useMemo(() => {
    const profits = displayedTrades
      .filter((t) => (Number(t.netPL) || 0) > 0)
      .map((t) => Number(t.netPL) || 0);
    if (profits.length === 0) return 0;
    return Number(Math.max(...profits).toFixed(2));
  }, [displayedTrades]);

  // Daily Summary data grouped by day
  const dailySummaryList = useMemo(() => {
    const map = new Map<string, { date: string; count: number; pl: number; losses: number; peakPL: number }>();
    const todayStr = new Date().toISOString().split('T')[0];

    // Ensure today is always present in summary
    map.set(todayStr, { date: todayStr, count: 0, pl: 0, losses: 0, peakPL: 0 });

    filteredTrades.forEach((t) => {
      const d = t.date || todayStr;
      const prev = map.get(d) || { date: d, count: 0, pl: 0, losses: 0, peakPL: 0 };
      const pl = Number(t.netPL) || 0;
      const newPL = prev.pl + pl;
      map.set(d, {
        date: d,
        count: prev.count + 1,
        pl: Number(newPL.toFixed(2)),
        losses: pl < 0 ? prev.losses + Math.abs(pl) : prev.losses,
        peakPL: Math.max(prev.peakPL, newPL),
      });
    });

    const list = Array.from(map.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return list.map((item) => {
      const isToday = item.date === todayStr;
      const dateObj = new Date(item.date + 'T00:00:00');
      const dayStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const drawdown = item.peakPL > item.pl ? ((item.peakPL - item.pl) / Math.max(startingBalance, 1)) * 100 : 0;

      return {
        dateRaw: item.date,
        formattedDate: dayStr,
        isToday,
        trades: item.count,
        drawdown: drawdown > 0 ? `-${drawdown.toFixed(1)}%` : '0%',
        result: item.pl,
      };
    });
  }, [filteredTrades, startingBalance]);

  // Format helper for trade ID
  const formatTradeId = (id: string, idx: number): string => {
    // Extract numbers or hash if alphanumeric
    const numPart = id.replace(/\D/g, '');
    if (numPart.length >= 6) return numPart.slice(0, 9);
    return (560500000 + (idx * 3821) + (id.charCodeAt(0) || 123)).toString().slice(0, 9);
  };

  // Helper for trade score
  const getTradeScore = (t: Trade): number | null => {
    if (t.psychology?.tradeRating) {
      return t.psychology.tradeRating > 10 ? t.psychology.tradeRating : t.psychology.tradeRating * 10;
    }
    if (t.outcome === 'WIN') return 82;
    if (t.outcome === 'LOSS') return 50;
    return null;
  };

  // Best/Worst Strategy highlight
  const bestStrategy = [...strategyStats].sort((a, b) => b.netPL - a.netPL)[0];
  const worstStrategy = [...strategyStats].sort((a, b) => a.netPL - b.netPL)[0];

  // Win Rate Assessment Badge Text
  const winRateAssessment = useMemo(() => {
    const wr = dashboardStats.winRate;
    if (wr >= 65) return { text: 'Excellent!', bg: 'bg-[#3B1F60] text-[#D8B4FE] border-[#6B21A8]/50' };
    if (wr >= 50) return { text: 'Good', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' };
    if (wr >= 40) return { text: 'Moderate', bg: 'bg-amber-950/60 text-amber-300 border-amber-500/40' };
    return { text: 'Needs Work', bg: 'bg-rose-950/60 text-rose-300 border-rose-500/40' };
  }, [dashboardStats.winRate]);

  // Arc calculation for Semicircle Win Rate Gauge
  const gaugePercentage = Math.min(100, Math.max(0, dashboardStats.winRate));
  const arcRadius = 68;
  const arcCircumference = Math.PI * arcRadius; // Half circle circumference
  const arcOffset = arcCircumference - (gaugePercentage / 100) * arcCircumference;

  // Chart data formatting
  const chartData = useMemo(() => {
    if (equityCurveData.length === 0) {
      return [{ date: '06/03', equity: startingBalance, pl: 0 }];
    }
    return equityCurveData.map((pt) => {
      // Format date like '06/03' or '06/04'
      const parts = pt.date.split(' ')[0].split('-');
      const formatted = parts.length === 3 ? `${parts[1]}/${parts[2]}` : pt.date;
      return {
        ...pt,
        displayDate: formatted,
      };
    });
  }, [equityCurveData, startingBalance]);

  return (
    <div className="pb-24 lg:pb-16 min-h-screen bg-[#0D0F12] text-[#F5F5F5]">
      <HeaderBar
        title="Performance Analytics & Statistics"
        subtitle="Live quantitative analytics breakdown across account equity, trades, risk rules, and trading execution."
      />

      <div className="px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-5">
        {/* Navigation Tabs for Analytics View */}
        <div className="w-full flex border-b border-[#22252B] bg-[#14161B] p-1.5 rounded-xl overflow-x-auto text-xs font-semibold scrollbar-none max-w-full">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3 sm:px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            Overview & Live Performance
          </button>
          <button
            onClick={() => setActiveTab('strategies')}
            className={`py-2 px-3 sm:px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === 'strategies'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            Strategy Analytics
          </button>
          <button
            onClick={() => setActiveTab('pairs')}
            className={`py-2 px-3 sm:px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === 'pairs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            Pair Analytics
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-3 sm:px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === 'sessions'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            Session Analytics
          </button>
          <button
            onClick={() => setActiveTab('days')}
            className={`py-2 px-3 sm:px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === 'days'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            Day-of-Week Analytics
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`py-2 px-3 sm:px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === 'news'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            News Event Analytics
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════════
            TAB 1: LIVE ANALYTICS DASHBOARD (MATCHING THE SCREENSHOT EXACTLY)
        ══════════════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-5">
            {/* Top Row: Account Balance Chart (Left) + Trades Table (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
              {/* ── Left Column (Account Balance + Daily Summary) ── */}
              <div className="lg:col-span-6 xl:col-span-6 space-y-4 sm:space-y-5 flex flex-col justify-between">
                {/* 1. Account Balance Card */}
                <div className="bg-[#14161C] border border-[#22252C] rounded-2xl p-3.5 sm:p-5 shadow-xl">
                  {/* Card Header with Inline Stats */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                      <h3 className="font-bold text-[#F5F5F5] text-sm sm:text-base tracking-tight">Account Balance</h3>

                      <div className="flex items-center gap-3 sm:gap-5 text-xs">
                        {/* Current P&L */}
                        <div>
                          <div className="text-[10px] sm:text-[11px] text-[#787F8B] flex items-center gap-1">
                            <span>Current P&L</span>
                            <HelpCircle className="w-3 h-3 text-[#5A606C]" />
                          </div>
                          <div className={`font-bold text-xs sm:text-base ${currentPeriodPL >= 0 ? 'text-[#C4FF00]' : 'text-[#C4FF00]'}`}>
                            {currentPeriodPL >= 0 ? '+' : '-'}${Math.abs(currentPeriodPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        {/* Equity */}
                        <div>
                          <div className="text-[10px] sm:text-[11px] text-[#787F8B] flex items-center gap-1">
                            <span>Equity</span>
                            <HelpCircle className="w-3 h-3 text-[#5A606C]" />
                          </div>
                          <div className="font-bold text-xs sm:text-base text-[#F5F5F5]">
                            ${currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        {/* Closed Balance */}
                        <div className="hidden xs:block sm:block">
                          <div className="text-[10px] sm:text-[11px] text-[#787F8B] flex items-center gap-1">
                            <span>Closed Balance</span>
                            <HelpCircle className="w-3 h-3 text-[#5A606C]" />
                          </div>
                          <div className="font-bold text-xs sm:text-base text-[#F5F5F5]">
                            ${closedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Period Selector Dropdown Button */}
                    <div className="relative">
                      <button
                        onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
                        className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#1B1E25] border border-[#2B2F38] text-[11px] sm:text-xs font-semibold text-[#D0D4DC] hover:text-white flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer"
                      >
                        <span className="capitalize">{dateRangeFilter === 'all' ? 'All' : dateRangeFilter.replace('_', ' ')}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-[#787F8B]" />
                      </button>

                      {periodDropdownOpen && (
                        <div className="absolute right-0 mt-1.5 w-36 bg-[#181B22] border border-[#2B2F38] rounded-xl shadow-2xl py-1 z-30 text-xs">
                          {(['all', 'today', 'this_week', 'this_month', '3m', 'ytd'] as DateRangeFilter[]).map((filter) => (
                            <button
                              key={filter}
                              onClick={() => {
                                setDateRangeFilter(filter);
                                setPeriodDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 hover:bg-[#222630] transition-colors ${
                                dateRangeFilter === filter ? 'text-emerald-400 font-bold' : 'text-[#A0A6AE]'
                              }`}
                            >
                              {filter === 'all' ? 'All Time' : filter.replace('_', ' ').toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chart Area - Explicit Fixed Height on Direct Parent */}
                  <div className="h-56 sm:h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="neonLimeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#C4FF00" stopOpacity={0.28} />
                            <stop offset="50%" stopColor="#7CD000" stopOpacity={0.10} />
                            <stop offset="100%" stopColor="#14161C" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#22252E" vertical={false} />
                        <XAxis
                          dataKey="displayDate"
                          stroke="#5A606C"
                          fontSize={10}
                          tickLine={false}
                          axisLine={{ stroke: '#22252E' }}
                        />
                        <YAxis
                          stroke="#5A606C"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-[#181B22] border border-[#2B2F38] p-2.5 rounded-xl shadow-2xl text-xs space-y-1">
                                  <p className="text-[10px] text-[#787F8B] font-mono">{data.date}</p>
                                  <p className="font-bold text-[#F5F5F5]">
                                    Equity: <span className="text-[#C4FF00]">${Number(data.equity || 0).toLocaleString()}</span>
                                  </p>
                                  <p className="text-[11px] text-[#A0A6AE]">
                                    Cumulative P/L: <span className={data.cumulativePL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                      {data.cumulativePL >= 0 ? '+' : ''}${data.cumulativePL}
                                    </span>
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="equity"
                          stroke="#C4FF00"
                          strokeWidth={2.5}
                          fill="url(#neonLimeGradient)"
                          isAnimationActive={true}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Daily Summary Card */}
                <div className="bg-[#14161C] border border-[#22252C] rounded-2xl p-3.5 sm:p-5 shadow-xl">
                  <h3 className="font-bold text-[#F5F5F5] text-sm sm:text-base mb-3">Daily Summary</h3>
                  <div className="w-full overflow-x-auto max-w-full">
                    <table className="w-full text-left text-xs min-w-[320px]">
                      <thead>
                        <tr className="text-[#787F8B] font-medium border-b border-[#22252C] pb-2">
                          <th className="py-2 px-3 font-normal">Date</th>
                          <th className="py-2 px-3 font-normal text-center">Trades</th>
                          <th className="py-2 px-3 font-normal text-center">Drawdown</th>
                          <th className="py-2 px-3 font-normal text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1D2027]">
                        {dailySummaryList.map((row, idx) => (
                          <tr key={row.dateRaw || idx} className="hover:bg-[#1B1E25]/50 transition-colors">
                            <td className="py-2.5 px-3 flex items-center gap-2 font-medium text-[#D0D4DC]">
                              <span>{row.formattedDate}</span>
                              {row.isToday && (
                                <span className="px-1.5 py-0.5 rounded-md bg-[#132A1C] border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                                  Today
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center text-[#D0D4DC] font-medium">{row.trades}</td>
                            <td className="py-2.5 px-3 text-center text-[#A0A6AE] font-mono">{row.drawdown}</td>
                            <td className={`py-2.5 px-3 text-right font-bold font-mono ${row.result >= 0 ? 'text-emerald-400' : 'text-[#EF4444]'}`}>
                              {row.result >= 0 ? '+' : '-'}${Math.abs(row.result).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── Right Column: Trades Table Card ── */}
              <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
                <div className="bg-[#14161C] border border-[#22252C] rounded-2xl shadow-xl flex flex-col h-full overflow-hidden">
                  {/* Header with Open/Closed Tabs & Fullscreen Icon */}
                  <div className="p-4 sm:p-5 pb-3 border-b border-[#22252C] flex items-center justify-between gap-3">
                    <h3 className="font-bold text-[#F5F5F5] text-base tracking-tight">Trades</h3>

                    <div className="flex items-center gap-2">
                      {/* Segmented Filter (Open / Closed) */}
                      <div className="bg-[#1B1E25] border border-[#2B2F38] p-0.5 rounded-xl flex items-center text-xs">
                        <button
                          onClick={() => setTradeFilterType('open')}
                          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                            tradeFilterType === 'open' ? 'bg-[#2B2F38] text-white' : 'text-[#787F8B] hover:text-[#D0D4DC]'
                          }`}
                        >
                          Open
                        </button>
                        <button
                          onClick={() => setTradeFilterType('closed')}
                          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                            tradeFilterType === 'closed' ? 'bg-[#2B2F38] text-white' : 'text-[#787F8B] hover:text-[#D0D4DC]'
                          }`}
                        >
                          Closed
                        </button>
                      </div>

                      {/* Fullscreen Expand Toggle */}
                      <button
                        onClick={() => setIsTradesExpanded(!isTradesExpanded)}
                        className="p-1.5 rounded-xl bg-[#1B1E25] border border-[#2B2F38] text-[#787F8B] hover:text-white transition-colors cursor-pointer"
                        title={isTradesExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isTradesExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Trades Data Table */}
                  <div className={`overflow-x-auto overflow-y-auto flex-1 ${isTradesExpanded ? 'max-h-[650px]' : 'max-h-[380px]'} scrollbar-thin`}>
                    {displayedTrades.length === 0 ? (
                      <div className="p-12 text-center text-[#787F8B] text-xs">
                        No {tradeFilterType} trades found for the selected period.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="sticky top-0 bg-[#161820] border-b border-[#22252C] text-[#787F8B] text-[11px] font-normal z-10">
                          <tr>
                            <th className="py-2.5 px-3 font-normal">ID</th>
                            <th className="py-2.5 px-3 font-normal">Symbol</th>
                            <th className="py-2.5 px-3 font-normal">Side</th>
                            <th className="py-2.5 px-3 font-normal">Open Date</th>
                            <th className="py-2.5 px-3 font-normal">Close Date</th>
                            <th className="py-2.5 px-3 font-normal">Entry</th>
                            <th className="py-2.5 px-3 font-normal">Exit</th>
                            <th className="py-2.5 px-3 font-normal">Qty</th>
                            <th className="py-2.5 px-3 font-normal">Fee</th>
                            <th className="py-2.5 px-3 font-normal">P&L</th>
                            <th className="py-2.5 px-3 font-normal text-center">Status</th>
                            <th className="py-2.5 px-3 font-normal text-center">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1D2027]">
                          {displayedTrades.map((t, idx) => {
                            const score = getTradeScore(t);
                            const tradePL = Number(t.netPL) || 0;
                            const feeVal = (Number(t.commission) || 0) + (Number(t.fees) || 0);

                            return (
                              <tr
                                key={t.id}
                                onClick={() => setSelectedTradeDetail(t)}
                                className="hover:bg-[#1B1E25]/60 transition-colors cursor-pointer"
                              >
                                <td className="py-2 px-3 font-mono text-[11px] text-[#787F8B]">
                                  {formatTradeId(t.id, idx)}
                                </td>
                                <td className="py-2 px-3 font-bold text-[#F5F5F5]">{t.symbol}</td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                      t.direction === 'BUY'
                                        ? 'bg-[#122B1C] border-emerald-500/40 text-emerald-400'
                                        : 'bg-[#2F1418] border-rose-500/40 text-rose-400'
                                    }`}
                                  >
                                    {t.direction === 'BUY' ? 'Buy' : 'Sell'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-[11px] text-[#A0A6AE] font-mono">
                                  {t.date} {t.time || '00:00'}
                                </td>
                                <td className="py-2 px-3 text-[11px] text-[#A0A6AE] font-mono">
                                  {t.outcome === 'OPEN' ? '-' : `${t.date} ${t.time || '00:00'}`}
                                </td>
                                <td className="py-2 px-3 font-mono text-[#D0D4DC]">
                                  ${Number(t.entry || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 px-3 font-mono text-[#D0D4DC]">
                                  {t.exitPrice ? `$${Number(t.exitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                </td>
                                <td className="py-2 px-3 font-mono text-[#D0D4DC]">{Number(t.lotSize || 0).toFixed(2)}</td>
                                <td className="py-2 px-3 font-mono text-[#A0A6AE]">
                                  {feeVal > 0 ? `-$${feeVal.toFixed(2)}` : '$0.00'}
                                </td>
                                <td
                                  className={`py-2 px-3 font-bold font-mono ${
                                    tradePL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {tradePL >= 0 ? '+' : '-'}${Math.abs(tradePL).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {t.outcome === 'WIN' && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#122B1C] border border-emerald-500/40 text-emerald-400">
                                      <ArrowUp className="w-2.5 h-2.5" /> Win
                                    </span>
                                  )}
                                  {t.outcome === 'LOSS' && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2F1418] border border-rose-500/40 text-rose-400">
                                      <ArrowDown className="w-2.5 h-2.5" /> Loss
                                    </span>
                                  )}
                                  {t.outcome === 'BREAKEVEN' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1E2129] border border-[#2B2F38] text-[#A0A6AE]">
                                      BE
                                    </span>
                                  )}
                                  {t.outcome === 'OPEN' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/40 border border-blue-500/40 text-blue-400">
                                      Open
                                    </span>
                                  )}
                                  {t.outcome === 'PARTIAL' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/40 border border-purple-500/40 text-purple-400">
                                      Partial
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {score !== null ? (
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#1B1E25] border border-[#2B2F38] text-xs font-bold text-[#D0D4DC]">
                                      {score}
                                    </span>
                                  ) : (
                                    <span className="text-[#5A606C]">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Summary Bar Across Bottom of Trades Table */}
                  <div className="bg-[#181A22] border-t border-[#22252C] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-[#A0A6AE]">
                    <div>
                      <span>Trades: </span>
                      <strong className="text-[#F5F5F5]">{displayedTrades.length}</strong>
                    </div>
                    <div>
                      <span>Fees: </span>
                      <strong className="text-[#F5F5F5]">
                        {totalFees > 0 ? `-$${totalFees.toFixed(2)}` : '$0.00'}
                      </strong>
                    </div>
                    <div>
                      <span>Win Rate: </span>
                      <strong className="text-[#F5F5F5]">
                        {winCount}/{displayedTrades.length}
                      </strong>
                    </div>
                    <div>
                      <span>Total P&L: </span>
                      <strong className={displayedTotalPL >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {displayedTotalPL >= 0 ? '+' : '-'}${Math.abs(displayedTotalPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Bottom Section: PnL from HWM + Win/Loss Rate Gauge + KPI Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
              {/* Card 1: PnL From All Time Hwm Equity */}
              <div className="lg:col-span-3 bg-[#14161C] border border-[#22252C] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between h-full min-h-[160px] sm:min-h-[175px]">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] sm:text-xs text-[#787F8B] font-medium flex items-center gap-1">
                    <span>PnL From All Time Hwm Equity</span>
                    <HelpCircle className="w-3 h-3 text-[#5A606C]" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2F1418] border border-rose-500/40 text-rose-400">
                    {pnlFromHwmPercent <= 0 ? `${pnlFromHwmPercent}%/peak` : `+${pnlFromHwmPercent}%`}
                  </span>
                </div>

                <div className="my-2">
                  <div className="text-xl sm:text-2xl font-bold text-[#F5F5F5] tracking-tight">
                    {pnlFromHwm >= 0 ? '+' : '-'}${Math.abs(pnlFromHwm).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {/* Subtle Progress Bar */}
                  <div className="w-full bg-[#1F222B] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, (currentEquity / Math.max(hwm, 1)) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#787F8B] pt-2 border-t border-[#1D2027]">
                  <span>Current Equity <strong className="text-[#D0D4DC]">${currentEquity.toLocaleString()}</strong></span>
                  <span>HWM <strong className="text-[#D0D4DC]">${hwm.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Card 2: Win / Loss Rate Gauge */}
              <div className="lg:col-span-3 bg-[#14161C] border border-[#22252C] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between h-full min-h-[160px] sm:min-h-[175px]">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] sm:text-xs text-[#787F8B] font-medium flex items-center gap-1">
                    <span>Win / Loss Rate</span>
                    <HelpCircle className="w-3 h-3 text-[#5A606C]" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${winRateAssessment.bg}`}>
                    {winRateAssessment.text}
                  </span>
                </div>

                {/* Semicircle Neon Purple Gauge */}
                <div className="flex flex-col items-center justify-center my-1 relative">
                  <svg width="150" height="80" viewBox="0 0 160 85" className="overflow-visible">
                    {/* Background Track Arc */}
                    <path
                      d="M 12 80 A 68 68 0 0 1 148 80"
                      fill="none"
                      stroke="#281A3C"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    {/* Foreground Glowing Purple Arc */}
                    <path
                      d="M 12 80 A 68 68 0 0 1 148 80"
                      fill="none"
                      stroke="#A855F7"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={arcCircumference}
                      strokeDashoffset={arcOffset}
                      style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                    />
                  </svg>
                  {/* Win Rate Text Center */}
                  <div className="absolute bottom-0 text-center">
                    <span className="text-lg sm:text-xl font-black text-white">{dashboardStats.winRate}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#787F8B] pt-1">
                  <span>Wins: <strong className="text-emerald-400">{dashboardStats.winningTrades}</strong></span>
                  <span>Losses: <strong className="text-rose-400">{dashboardStats.losingTrades}</strong></span>
                </div>
              </div>

              {/* Card 3: 2-Row Stat Cards Grid */}
              <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3">
                {/* Row 1 */}
                <div className="bg-[#14161C] border border-[#22252C] rounded-xl p-3 sm:p-3.5 shadow-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#787F8B] font-medium flex items-center gap-1 truncate">
                    <span>Net Profit</span>
                    <HelpCircle className="w-3 h-3 text-[#5A606C] shrink-0" />
                  </div>
                  <div className={`text-sm sm:text-base font-bold mt-1 truncate ${dashboardStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {dashboardStats.netProfit >= 0 ? '+' : '-'}${Math.abs(dashboardStats.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-[#14161C] border border-[#22252C] rounded-xl p-3 sm:p-3.5 shadow-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#787F8B] font-medium flex items-center gap-1 truncate">
                    <span>Gross Profit</span>
                    <HelpCircle className="w-3 h-3 text-[#5A606C] shrink-0" />
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[#F5F5F5] mt-1 truncate">
                    ${dashboardStats.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-[#14161C] border border-[#22252C] rounded-xl p-3 sm:p-3.5 shadow-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#787F8B] font-medium flex items-center gap-1 truncate">
                    <span>Gross Loss</span>
                    <HelpCircle className="w-3 h-3 text-[#5A606C] shrink-0" />
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[#F5F5F5] mt-1 truncate">
                    ${dashboardStats.grossLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-[#14161C] border border-[#22252C] rounded-xl p-3.5 shadow-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#787F8B] font-medium flex items-center gap-1 truncate">
                    <span>Profit Factor</span>
                    <HelpCircle className="w-3 h-3 text-[#5A606C] shrink-0" />
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[#F5F5F5] mt-1 truncate">
                    {dashboardStats.profitFactor.toFixed(2)}
                  </div>
                </div>

                <div className="bg-[#14161C] border border-[#22252C] rounded-xl p-3.5 shadow-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#787F8B] font-medium flex items-center gap-1 truncate">
                    <span>Best Profit</span>
                    <HelpCircle className="w-3 h-3 text-[#5A606C] shrink-0" />
                  </div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 mt-1 truncate">
                    ${bestProfit.toFixed(2)}
                  </div>
                </div>

                {/* Row 2 */}
                <div className="bg-[#14161C] border border-[#22252C] rounded-xl p-3 sm:p-3.5 shadow-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#787F8B] font-medium flex items-center gap-1 truncate">
                    <span>Biggest Loss</span>
                    <HelpCircle className="w-3 h-3 text-[#5A606C] shrink-0" />
                  </div>
                  <div className="text-sm sm:text-base font-bold text-rose-400 mt-1 truncate">
                    ${biggestLoss.toFixed(2)}
                  </div>
                </div>

                <div className="bg-[#14161C] border border-[#22252C] rounded-xl p-3 sm:p-3.5 shadow-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#787F8B] font-medium flex items-center gap-1 truncate">
                    <span>Expectancy</span>
                    <HelpCircle className="w-3 h-3 text-[#5A606C] shrink-0" />
                  </div>
                  <div className={`text-sm sm:text-base font-bold mt-1 truncate ${dashboardStats.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {dashboardStats.expectancy >= 0 ? '+' : '-'}${Math.abs(dashboardStats.expectancy).toFixed(2)}
                  </div>
                </div>

                <div className="bg-[#14161C] border border-[#22252C] rounded-xl p-3 sm:p-3.5 shadow-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#787F8B] font-medium flex items-center gap-1 truncate">
                    <span>Avg. Trade Size</span>
                    <HelpCircle className="w-3 h-3 text-[#5A606C] shrink-0" />
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[#F5F5F5] mt-1 truncate">
                    ${avgTradeSize.toFixed(2)}
                  </div>
                </div>

                <div className="bg-[#14161C] border border-[#22252C] rounded-xl p-3 sm:p-3.5 shadow-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#787F8B] font-medium flex items-center gap-1 truncate">
                    <span>Avg R:R</span>
                    <HelpCircle className="w-3 h-3 text-[#5A606C] shrink-0" />
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[#F5F5F5] mt-1 truncate">
                    1 : {dashboardStats.avgRiskReward}R
                  </div>
                </div>

                <div className="bg-[#14161C] border border-[#22252C] rounded-xl p-3 sm:p-3.5 shadow-lg">
                  <div className="text-[10px] sm:text-[11px] text-[#787F8B] font-medium flex items-center gap-1 truncate">
                    <span>Max Drawdown</span>
                    <HelpCircle className="w-3 h-3 text-[#5A606C] shrink-0" />
                  </div>
                  <div className="text-sm sm:text-base font-bold text-rose-400 mt-1 truncate">
                    -{dashboardStats.maxDrawdownPercent}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════
            TAB 2: STRATEGY ANALYTICS
        ══════════════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'strategies' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bestStrategy && (
                <div className="bg-[#14161C] border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block">Most Profitable Strategy</span>
                    <h4 className="font-bold text-[#F5F5F5] text-base">{bestStrategy.strategyName}</h4>
                    <p className="text-xs text-[#A0A6AE]">
                      Net P/L: <strong className="text-emerald-400">+${bestStrategy.netPL.toLocaleString()}</strong> ({bestStrategy.winRate}% Win Rate)
                    </p>
                  </div>
                </div>
              )}

              {worstStrategy && (
                <div className="bg-[#14161C] border border-rose-500/40 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 font-bold uppercase block">Lowest Performing Strategy</span>
                    <h4 className="font-bold text-[#F5F5F5] text-base">{worstStrategy.strategyName}</h4>
                    <p className="text-xs text-[#A0A6AE]">
                      Net P/L: <strong className="text-rose-400">${worstStrategy.netPL.toLocaleString()}</strong> ({worstStrategy.winRate}% Win Rate)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#14161C] border border-[#22252C] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-[#22252C]">
                <h3 className="font-bold text-[#F5F5F5] text-sm">Strategy Performance Matrix</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#F5F5F5]">
                  <thead className="bg-[#1B1E25] text-[#787F8B] uppercase tracking-wider font-semibold border-b border-[#22252C]">
                    <tr>
                      <th className="py-3 px-4">Strategy</th>
                      <th className="py-3 px-4">Trades</th>
                      <th className="py-3 px-4">Wins / Losses</th>
                      <th className="py-3 px-4">Win Rate</th>
                      <th className="py-3 px-4">Average R:R</th>
                      <th className="py-3 px-4">Profit Factor</th>
                      <th className="py-3 px-4">Net P/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1D2027]">
                    {strategyStats.map((st) => (
                      <tr key={st.strategyId} className="hover:bg-[#1B1E25]/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#F5F5F5] flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }} />
                          <span>{st.strategyName}</span>
                        </td>
                        <td className="py-3 px-4">{st.totalTrades}</td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-400 font-bold">{st.wins}W</span>
                          <span className="text-[#6F7680]"> / </span>
                          <span className="text-rose-400 font-bold">{st.losses}L</span>
                        </td>
                        <td className="py-3 px-4 font-bold">{st.winRate}%</td>
                        <td className="py-3 px-4">{st.avgRR}R</td>
                        <td className="py-3 px-4 font-bold">{st.profitFactor}</td>
                        <td className="py-3 px-4 font-bold">
                          <span className={st.netPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {st.netPL >= 0 ? '+' : ''}${st.netPL.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════
            TAB 3: PAIR ANALYTICS
        ══════════════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pairs' && (
          <div className="space-y-5">
            <div className="bg-[#14161C] border border-[#22252C] rounded-2xl p-5 shadow-xl">
              <h3 className="font-bold text-[#F5F5F5] text-sm mb-4">P/L Distribution by Instrument / Pair</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pairStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22252C" vertical={false} />
                    <XAxis dataKey="symbol" stroke="#787F8B" fontSize={11} />
                    <YAxis stroke="#787F8B" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#181B22', borderColor: '#2B2F38', color: '#F5F5F5' }}
                    />
                    <Bar dataKey="netPL" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#14161C] border border-[#22252C] rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-[#F5F5F5]">
                <thead className="bg-[#1B1E25] text-[#787F8B] uppercase tracking-wider font-semibold border-b border-[#22252C]">
                  <tr>
                    <th className="py-3 px-4">Pair / Symbol</th>
                    <th className="py-3 px-4">Trades</th>
                    <th className="py-3 px-4">Win Rate</th>
                    <th className="py-3 px-4">Avg R:R</th>
                    <th className="py-3 px-4">Profit Factor</th>
                    <th className="py-3 px-4">Net P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D2027]">
                  {pairStats.map((p) => (
                    <tr key={p.symbol} className="hover:bg-[#1B1E25]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#F5F5F5]">{p.symbol}</td>
                      <td className="py-3 px-4">{p.totalTrades}</td>
                      <td className="py-3 px-4 font-bold">{p.winRate}%</td>
                      <td className="py-3 px-4">{p.avgRR}R</td>
                      <td className="py-3 px-4 font-bold">{p.profitFactor}</td>
                      <td className="py-3 px-4 font-bold">
                        <span className={p.netPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {p.netPL >= 0 ? '+' : ''}${p.netPL.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════
            TAB 4: SESSION ANALYTICS
        ══════════════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'sessions' && (
          <div className="bg-[#14161C] border border-[#22252C] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#22252C]">
              <h3 className="font-bold text-[#F5F5F5] text-sm">Trading Session Performance Breakdown</h3>
            </div>
            <table className="w-full text-left text-xs text-[#F5F5F5]">
              <thead className="bg-[#1B1E25] text-[#787F8B] uppercase tracking-wider font-semibold border-b border-[#22252C]">
                <tr>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Trades</th>
                  <th className="py-3 px-4">Win Rate</th>
                  <th className="py-3 px-4">Avg R:R</th>
                  <th className="py-3 px-4">Net P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2027]">
                {sessionStats.map((s) => (
                  <tr key={s.session} className="hover:bg-[#1B1E25]/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#F5F5F5]">{s.session}</td>
                    <td className="py-3 px-4">{s.totalTrades}</td>
                    <td className="py-3 px-4 font-bold">{s.winRate}%</td>
                    <td className="py-3 px-4">{s.avgRR}R</td>
                    <td className="py-3 px-4 font-bold">
                      <span className={s.netPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {s.netPL >= 0 ? '+' : ''}${s.netPL.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════
            TAB 5: DAY-OF-WEEK ANALYTICS
        ══════════════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'days' && (
          <div className="bg-[#14161C] border border-[#22252C] rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-[#F5F5F5] text-sm">Performance by Day of Week</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {dayOfWeekStats.map((d) => (
                <div key={d.day} className="bg-[#1B1E25] border border-[#22252C] rounded-xl p-4 text-center">
                  <span className="text-xs font-bold text-[#787F8B] uppercase block mb-1">{d.day}</span>
                  <span className={`text-base font-bold ${d.netPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {d.netPL >= 0 ? '+' : ''}${d.netPL.toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-[#5A606C] mt-1">
                    {d.totalTrades} Trades • {d.winRate}% WR
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════
            TAB 6: NEWS EVENT ANALYTICS
        ══════════════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'news' && (
          <div className="bg-[#14161C] border border-[#22252C] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#22252C]">
              <h3 className="font-bold text-[#F5F5F5] text-sm">Economic News Catalyst Performance</h3>
            </div>
            {newsStats.length === 0 ? (
              <div className="p-12 text-center text-[#787F8B] text-xs">
                No news-based trades recorded yet. Assign news event tags when recording trades.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-[#F5F5F5]">
                <thead className="bg-[#1B1E25] text-[#787F8B] uppercase tracking-wider font-semibold border-b border-[#22252C]">
                  <tr>
                    <th className="py-3 px-4">News Catalyst</th>
                    <th className="py-3 px-4">Trades</th>
                    <th className="py-3 px-4">Wins / Losses</th>
                    <th className="py-3 px-4">Win Rate</th>
                    <th className="py-3 px-4">Net P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D2027]">
                  {newsStats.map((n) => (
                    <tr key={n.newsEvent} className="hover:bg-[#1B1E25]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#F5F5F5]">{n.newsEvent}</td>
                      <td className="py-3 px-4">{n.totalTrades}</td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-bold">{n.wins}W</span> /{' '}
                        <span className="text-rose-400 font-bold">{n.losses}L</span>
                      </td>
                      <td className="py-3 px-4 font-bold">{n.winRate}%</td>
                      <td className="py-3 px-4 font-bold">
                        <span className={n.netPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {n.netPL >= 0 ? '+' : ''}${n.netPL.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
