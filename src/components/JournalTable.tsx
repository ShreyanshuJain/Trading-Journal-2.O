import React, { useState, useMemo } from 'react';
import { useJournal } from '../context/JournalContext';
import { HeaderBar } from './HeaderBar';
import { Trade, TradeOutcome, TradeDirection, TradingSession } from '../types';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit2,
  Copy,
  Trash2,
  Image as ImageIcon,
  ArrowUpDown,
  Plus,
  RotateCcw,
} from 'lucide-react';

export const JournalTable: React.FC = () => {
  const {
    filteredTrades,
    strategies,
    accounts,
    setSelectedTradeDetail,
    setEditingTrade,
    duplicateTrade,
    deleteTrade,
    setIsAddTradeOpen,
  } = useJournal();

  // Local Filters
  const [symbolFilter, setSymbolFilter] = useState<string>('all');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [searchLocal, setSearchLocal] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'netPL' | 'symbol' | 'realizedRR'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Unique symbols extracted from trades
  const availableSymbols = useMemo(() => {
    const set = new Set<string>();
    filteredTrades.forEach((t) => set.add(t.symbol.toUpperCase()));
    return Array.from(set).sort();
  }, [filteredTrades]);

  // Apply local filters and sorting
  const displayTrades = useMemo(() => {
    let list = [...filteredTrades];

    if (symbolFilter !== 'all') {
      list = list.filter((t) => t.symbol.toUpperCase() === symbolFilter);
    }
    if (strategyFilter !== 'all') {
      list = list.filter((t) => t.strategyId === strategyFilter);
    }
    if (directionFilter !== 'all') {
      list = list.filter((t) => t.direction === directionFilter);
    }
    if (outcomeFilter !== 'all') {
      list = list.filter((t) => t.outcome === outcomeFilter);
    }
    if (sessionFilter !== 'all') {
      list = list.filter((t) => t.session === sessionFilter);
    }
    if (searchLocal.trim() !== '') {
      const q = searchLocal.toLowerCase();
      list = list.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.setup.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortField === 'date') {
        const dtA = `${a.date} ${a.time || '00:00'}`;
        const dtB = `${b.date} ${b.time || '00:00'}`;
        return sortOrder === 'asc' ? dtA.localeCompare(dtB) : dtB.localeCompare(dtA);
      }
      if (sortField === 'netPL') {
        return sortOrder === 'asc' ? a.netPL - b.netPL : b.netPL - a.netPL;
      }
      if (sortField === 'symbol') {
        return sortOrder === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      }
      if (sortField === 'realizedRR') {
        return sortOrder === 'asc' ? a.realizedRR - b.realizedRR : b.realizedRR - a.realizedRR;
      }
      return 0;
    });

    return list;
  }, [
    filteredTrades,
    symbolFilter,
    strategyFilter,
    directionFilter,
    outcomeFilter,
    sessionFilter,
    searchLocal,
    sortField,
    sortOrder,
  ]);

  const handleSort = (field: 'date' | 'netPL' | 'symbol' | 'realizedRR') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Export CSV function
  const exportToCSV = () => {
    if (displayTrades.length === 0) return;
    const headers = [
      'Date',
      'Time',
      'Symbol',
      'Direction',
      'Session',
      'Outcome',
      'Entry',
      'Stop Loss',
      'Take Profit',
      'Exit Price',
      'Lot Size',
      'Risk $',
      'Planned R:R',
      'Realized R:R',
      'Net P/L',
      'Notes',
    ];

    const rows = displayTrades.map((t) => [
      t.date,
      t.time,
      t.symbol,
      t.direction,
      t.session,
      t.outcome,
      t.entry,
      t.stopLoss,
      t.takeProfit,
      t.exitPrice,
      t.lotSize,
      t.riskAmount,
      t.plannedRR,
      t.realizedRR,
      t.netPL,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trading_journal_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSymbolFilter('all');
    setStrategyFilter('all');
    setDirectionFilter('all');
    setOutcomeFilter('all');
    setSessionFilter('all');
    setSearchLocal('');
  };

  return (
    <div className="pb-20 lg:pb-12">
      <HeaderBar
        title="Trading Journal"
        subtitle="Complete chronological history of every executed trade with full metrics and review notes."
      />

      <div className="px-4 md:px-6 space-y-4">
        {/* Multi-Filter Bar */}
        <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-[#6F7680] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search notes, setup..."
                value={searchLocal}
                onChange={(e) => setSearchLocal(e.target.value)}
                className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Symbol Filter */}
            <select
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Pairs</option>
              {availableSymbols.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>

            {/* Strategy Filter */}
            <select
              value={strategyFilter}
              onChange={(e) => setStrategyFilter(e.target.value)}
              className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Strategies</option>
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Outcome Filter */}
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Outcomes</option>
              <option value="WIN">WIN</option>
              <option value="LOSS">LOSS</option>
              <option value="BREAKEVEN">BREAKEVEN</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="OPEN">OPEN</option>
            </select>

            {/* Direction Filter */}
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Directions</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>

            {/* Session Filter */}
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Sessions</option>
              <option value="Asia">Asia</option>
              <option value="London">London</option>
              <option value="New York">New York</option>
              <option value="London/NY Overlap">London/NY Overlap</option>
            </select>

            <button
              onClick={resetFilters}
              className="p-1.5 rounded-lg bg-[#1B1F24] border border-[#292D33] text-[#A0A6AE] hover:text-[#F5F5F5]"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={exportToCSV}
            className="py-1.5 px-3 rounded-lg bg-[#1B1F24] hover:bg-[#22272E] border border-[#292D33] text-[#F5F5F5] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Journal Data Table */}
        <div className="bg-[#15181D] border border-[#292D33] rounded-xl overflow-hidden shadow-xl">
          {displayTrades.length === 0 ? (
            <div className="py-16 text-center text-[#6F7680]">
              <p className="text-base font-semibold text-[#A0A6AE]">No matching trades found</p>
              <p className="text-xs mt-1">Adjust your filter criteria or record a new trade.</p>
              <button
                onClick={() => setIsAddTradeOpen(true)}
                className="mt-4 py-2 px-4 rounded-lg bg-emerald-600 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Trade</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#F5F5F5]">
                <thead className="bg-[#1B1F24] text-[#6F7680] uppercase tracking-wider font-semibold border-b border-[#292D33]">
                  <tr>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-[#F5F5F5]"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Date/Time</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-[#F5F5F5]"
                      onClick={() => handleSort('symbol')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Pair</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Direction</th>
                    <th className="py-3 px-3">Session</th>
                    <th className="py-3 px-3">Strategy</th>
                    <th className="py-3 px-3">Outcome</th>
                    <th className="py-3 px-3">Entry</th>
                    <th className="py-3 px-3">SL / TP</th>
                    <th className="py-3 px-3">Exit</th>
                    <th className="py-3 px-3">Lots</th>
                    <th className="py-3 px-3">Risk $</th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-[#F5F5F5]"
                      onClick={() => handleSort('realizedRR')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Realized R:R</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-[#F5F5F5]"
                      onClick={() => handleSort('netPL')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Net P/L</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Charts</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292D33]">
                  {displayTrades.map((trade) => {
                    const strat = strategies.find((s) => s.id === trade.strategyId);
                    const acc = accounts.find((a) => a.id === trade.accountId);

                    const isWin = trade.outcome === 'WIN';
                    const isLoss = trade.outcome === 'LOSS';
                    const isBE = trade.outcome === 'BREAKEVEN';
                    const isOpen = trade.outcome === 'OPEN';

                    return (
                      <tr key={trade.id} className="hover:bg-[#1B1F24]/60 transition-colors">
                        <td className="py-3 px-3 text-[#A0A6AE] whitespace-nowrap">
                          <div className="font-medium text-[#F5F5F5]">{trade.date}</div>
                          <div className="text-[10px] text-[#6F7680]">{trade.time}</div>
                        </td>

                        <td className="py-3 px-3 font-bold text-[#F5F5F5] whitespace-nowrap">
                          {trade.symbol}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              trade.direction === 'BUY'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                            }`}
                          >
                            {trade.direction}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[#A0A6AE] whitespace-nowrap">
                          {trade.session}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {strat ? (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                              style={{ backgroundColor: `${strat.color}33`, color: strat.color }}
                            >
                              {strat.name}
                            </span>
                          ) : (
                            <span className="text-[#6F7680]">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isWin
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isLoss
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isBE
                                ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                : isOpen
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {trade.outcome}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-[#A0A6AE]">{trade.entry}</td>

                        <td className="py-3 px-3 font-mono text-[11px] text-[#6F7680]">
                          <div className="text-red-400">SL: {trade.stopLoss}</div>
                          <div className="text-emerald-400">TP: {trade.takeProfit}</div>
                        </td>

                        <td className="py-3 px-3 font-mono text-[#A0A6AE]">
                          {trade.exitPrice || '-'}
                        </td>

                        <td className="py-3 px-3 text-[#A0A6AE]">{trade.lotSize}</td>

                        <td className="py-3 px-3 text-[#A0A6AE]">${trade.riskAmount}</td>

                        <td className="py-3 px-3 font-semibold text-[#F5F5F5]">
                          {trade.realizedRR}R
                        </td>

                        <td className="py-3 px-3 font-bold whitespace-nowrap">
                          <span className={trade.netPL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {trade.netPL >= 0 ? '+' : ''}${trade.netPL.toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {trade.screenshots && trade.screenshots.length > 0 ? (
                            <button
                              onClick={() => setSelectedTradeDetail(trade)}
                              className="p-1 px-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer inline-flex items-center gap-1 text-[10px]"
                              title="View Attached Charts"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>{trade.screenshots.length}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedTradeDetail(trade)}
                              className="p-1 px-1.5 rounded bg-[#1B1F24] hover:bg-[#22272E] text-[#6F7680] hover:text-emerald-400 border border-[#292D33] transition-all cursor-pointer inline-flex items-center gap-1 text-[10px]"
                              title="Add Chart Screenshot"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedTradeDetail(trade)}
                              className="p-1.5 rounded bg-[#1B1F24] hover:bg-[#22272E] text-[#A0A6AE] hover:text-[#F5F5F5] border border-[#292D33] cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingTrade(trade)}
                              className="p-1.5 rounded bg-[#1B1F24] hover:bg-[#22272E] text-[#A0A6AE] hover:text-[#F5F5F5] border border-[#292D33] cursor-pointer"
                              title="Edit Trade"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => duplicateTrade(trade.id)}
                              className="p-1.5 rounded bg-[#1B1F24] hover:bg-[#22272E] text-[#A0A6AE] hover:text-[#F5F5F5] border border-[#292D33] cursor-pointer"
                              title="Duplicate Trade"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTrade(trade.id)}
                              className="p-1.5 rounded bg-[#1B1F24] hover:bg-red-500/20 text-[#A0A6AE] hover:text-red-400 border border-[#292D33] cursor-pointer"
                              title="Delete Trade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
