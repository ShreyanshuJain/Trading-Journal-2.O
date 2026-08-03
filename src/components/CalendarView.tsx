import React, { useState, useMemo } from 'react';
import { useJournal } from '../context/JournalContext';
import { HeaderBar } from './HeaderBar';
import { Trade } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Eye, TrendingUp, TrendingDown } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const {
    trades,
    activeAccountId,
    setSelectedTradeDetail,
    setIsAddTradeOpen,
  } = useJournal();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDayTrades, setSelectedDayTrades] = useState<{ dateStr: string; trades: Trade[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Filter trades by active account
  const accountTrades = useMemo(() => {
    if (activeAccountId === 'all') return trades;
    return trades.filter((t) => t.accountId === activeAccountId);
  }, [trades, activeAccountId]);

  // Calendar math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday

  const prevMonthDays = new Date(year, month, 0).getDate();

  // Group trades by date string "YYYY-MM-DD"
  const tradesByDate = useMemo(() => {
    const map: Record<string, { trades: Trade[]; dailyPL: number; winCount: number; lossCount: number }> = {};

    accountTrades.forEach((t) => {
      if (!t.date) return;
      const formattedDate = t.date.includes('T') ? t.date.split('T')[0] : t.date;
      if (!map[formattedDate]) {
        map[formattedDate] = { trades: [], dailyPL: 0, winCount: 0, lossCount: 0 };
      }
      map[formattedDate].trades.push(t);
      map[formattedDate].dailyPL += Number(t.netPL || 0);
      if (t.outcome === 'WIN') map[formattedDate].winCount++;
      if (t.outcome === 'LOSS') map[formattedDate].lossCount++;
    });

    return map;
  }, [accountTrades]);

  // Monthly stats calculation
  const monthlyStats = useMemo(() => {
    let totalPL = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalTrades = 0;

    Object.entries(tradesByDate).forEach(([dateStr, data]) => {
      const dayInfo = data as { trades: Trade[]; dailyPL: number; winCount: number; lossCount: number };
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (y === year && m === month) {
          totalPL += dayInfo.dailyPL;
          totalWins += dayInfo.winCount;
          totalLosses += dayInfo.lossCount;
          totalTrades += dayInfo.trades.length;
        }
      }
    });

    return {
      monthlyPL: Number(totalPL.toFixed(2)),
      monthlyWins: totalWins,
      monthlyLosses: totalLosses,
      monthlyTrades: totalTrades,
    };
  }, [tradesByDate, year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build grid days
  const calendarGrid = useMemo(() => {
    const grid: { dayNum: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const pDay = prevMonthDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
      grid.push({ dayNum: pDay, isCurrentMonth: false, dateStr });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      grid.push({ dayNum: d, isCurrentMonth: true, dateStr });
    }

    // Next month padding
    const remaining = 35 - grid.length;
    if (remaining > 0) {
      for (let n = 1; n <= remaining; n++) {
        const nextM = month === 11 ? 0 : month + 1;
        const nextY = month === 11 ? year + 1 : year;
        const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
        grid.push({ dayNum: n, isCurrentMonth: false, dateStr });
      }
    }

    return grid;
  }, [firstDayIndex, prevMonthDays, daysInMonth, year, month]);

  return (
    <div className="pb-20 lg:pb-12">
      <HeaderBar
        title="Calendar Trading Journal"
        subtitle="Visual daily performance calendar and monthly profit/loss distribution."
      />

      <div className="px-4 md:px-6 space-y-6">
        {/* Calendar Navigation & Monthly Summary */}
        <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={month}
                onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value, 10), 1))}
                className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] font-bold text-sm rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value, 10), month, 1))}
                className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] font-bold text-sm rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {[2023, 2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[#1B1F24] border border-[#292D33] p-1 rounded-lg">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded text-[#A0A6AE] hover:text-[#F5F5F5] hover:bg-[#292D33] cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2 py-0.5 rounded text-xs font-semibold text-emerald-400 hover:bg-[#292D33] cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded text-[#A0A6AE] hover:text-[#F5F5F5] hover:bg-[#292D33] cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Monthly Totals Badge */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="bg-[#1B1F24] border border-[#292D33] px-3 py-1.5 rounded-lg">
              <span className="text-[#6F7680] block text-[10px] uppercase">Monthly Trades</span>
              <span className="text-[#F5F5F5] font-bold">{monthlyStats.monthlyTrades} Trades</span>
            </div>

            <div className="bg-[#1B1F24] border border-[#292D33] px-3 py-1.5 rounded-lg">
              <span className="text-[#6F7680] block text-[10px] uppercase">Monthly Win/Loss</span>
              <span className="text-emerald-400 font-bold">{monthlyStats.monthlyWins}W</span>
              <span className="text-[#6F7680]"> / </span>
              <span className="text-red-400 font-bold">{monthlyStats.monthlyLosses}L</span>
            </div>

            <div className="bg-[#1B1F24] border border-[#292D33] px-3 py-1.5 rounded-lg">
              <span className="text-[#6F7680] block text-[10px] uppercase">Monthly Net P/L</span>
              <span
                className={`text-sm font-bold ${
                  monthlyStats.monthlyPL >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {monthlyStats.monthlyPL >= 0 ? '+' : ''}${monthlyStats.monthlyPL.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="bg-[#15181D] border border-[#292D33] rounded-xl overflow-x-auto shadow-xl">
          <div className="min-w-[700px]">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 bg-[#1B1F24] border-b border-[#292D33] text-center text-[11px] font-bold uppercase text-[#6F7680] py-2.5">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-[#292D33]">
              {calendarGrid.map((cell, idx) => {
                const dayData = tradesByDate[cell.dateStr];
                const hasTrades = dayData && dayData.trades.length > 0;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (hasTrades) {
                        setSelectedDayTrades({ dateStr: cell.dateStr, trades: dayData.trades });
                      } else {
                        setIsAddTradeOpen(true);
                      }
                    }}
                    className={`min-h-[110px] p-2 flex flex-col justify-between transition-all cursor-pointer min-w-0 overflow-hidden relative ${
                      !cell.isCurrentMonth
                        ? 'bg-[#0D0F12]/40 opacity-40'
                        : hasTrades
                        ? dayData.dailyPL >= 0
                          ? 'bg-emerald-950/20 hover:bg-emerald-900/30'
                          : 'bg-red-950/20 hover:bg-red-900/30'
                        : 'hover:bg-[#1B1F24]/50'
                    }`}
                  >
                    {/* Top Cell Header */}
                    <div className="flex items-center justify-between gap-1 min-w-0 w-full">
                      <span
                        className={`text-xs font-bold shrink-0 ${
                          cell.isCurrentMonth ? 'text-[#F5F5F5]' : 'text-[#6F7680]'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {hasTrades && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate max-w-[75%] shrink-0 text-right ${
                            dayData.dailyPL >= 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                          title={`${dayData.dailyPL >= 0 ? '+' : ''}$${dayData.dailyPL.toLocaleString()}`}
                        >
                          {dayData.dailyPL >= 0 ? '+' : ''}${dayData.dailyPL.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Trades Chips */}
                    <div className="space-y-1 my-1.5 min-w-0 w-full overflow-hidden">
                      {hasTrades &&
                        dayData.trades.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            className="px-1.5 py-0.5 rounded bg-[#1B1F24] border border-[#292D33] text-[10px] flex items-center justify-between gap-1 min-w-0 overflow-hidden"
                          >
                            <span className="font-bold text-[#F5F5F5] truncate min-w-0">{t.symbol}</span>
                            <span
                              className={`font-semibold shrink-0 text-[10px] ${
                                t.netPL >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {t.netPL >= 0 ? '+' : ''}${t.netPL.toLocaleString()}
                            </span>
                          </div>
                        ))}

                      {hasTrades && dayData.trades.length > 2 && (
                        <span className="text-[9px] text-[#A0A6AE] block text-center font-medium truncate">
                          +{dayData.trades.length - 2} more
                        </span>
                      )}
                    </div>

                    {/* Add trade placeholder button on hover */}
                    {!hasTrades && cell.isCurrentMonth && (
                      <div className="opacity-0 hover:opacity-100 transition-opacity text-center text-[10px] text-[#6F7680] font-medium">
                        + Record Trade
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Trades Modal */}
      {selectedDayTrades && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#292D33] pb-3">
              <div>
                <h3 className="font-bold text-[#F5F5F5]">Trades for {selectedDayTrades.dateStr}</h3>
                <p className="text-xs text-[#A0A6AE]">
                  {selectedDayTrades.trades.length} recorded trade(s)
                </p>
              </div>
              <button
                onClick={() => setSelectedDayTrades(null)}
                className="p-1.5 rounded-lg bg-[#292D33] text-[#A0A6AE] hover:text-[#F5F5F5] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedDayTrades.trades.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTradeDetail(t);
                    setSelectedDayTrades(null);
                  }}
                  className="bg-[#1B1F24] border border-[#292D33] hover:border-emerald-500/50 p-3 rounded-lg flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#F5F5F5]">{t.symbol}</span>
                      <span className="text-xs text-[#6F7680]">{t.direction}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          t.outcome === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {t.outcome}
                      </span>
                    </div>
                    <p className="text-xs text-[#A0A6AE] mt-0.5">{t.time} • {t.session} Session</p>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-bold ${t.netPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.netPL >= 0 ? '+' : ''}${t.netPL.toLocaleString()}
                    </span>
                    <span className="block text-xs text-[#6F7680]">{t.realizedRR} R</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#292D33] flex justify-end">
              <button
                onClick={() => {
                  setSelectedDayTrades(null);
                  setIsAddTradeOpen(true);
                }}
                className="py-1.5 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
              >
                + Add Another Trade For This Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
