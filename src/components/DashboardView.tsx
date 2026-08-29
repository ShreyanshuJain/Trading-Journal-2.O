import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { HeaderBar } from './HeaderBar';
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus,
  Percent,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DashboardView: React.FC = () => {
  const {
    dashboardStats,
    equityCurveData,
    filteredTrades,
    setSelectedTradeDetail,
    setIsAddTradeOpen,
  } = useJournal();

  const [curveType, setCurveType] = useState<'equity' | 'pl' | 'r'>('equity');

  const isNetPositive = dashboardStats.totalPL >= 0;

  return (
    <div className="pb-20 lg:pb-12">
      <HeaderBar
        title="Trading Performance Dashboard"
        subtitle="Real-time performance metrics, equity growth curve, and execution analytics."
      />

      <div className="px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
        {/* Metric Cards Grid (4 cols desktop, 2 cols tablet, 1 col mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Net P/L */}
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A0A6AE]">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Total Net P/L</span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isNetPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}
              >
                {isNetPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
            </div>
            <div className="mt-2">
              <div
                className={`text-lg sm:text-2xl font-bold tracking-tight ${
                  isNetPositive ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isNetPositive ? '+' : ''}${dashboardStats.totalPL.toLocaleString()}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#6F7680] mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Gross Win: +${dashboardStats.grossProfit.toLocaleString()}</span>
                <span className="hidden xs:inline">•</span>
                <span>Gross Loss: -${dashboardStats.grossLoss.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Win Rate */}
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A0A6AE]">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Win Rate</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-bold tracking-tight text-[#F5F5F5]">
                {dashboardStats.winRate}%
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#6F7680] mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-emerald-400 font-semibold">{dashboardStats.winningTrades} Wins</span>
                <span>/</span>
                <span className="text-red-400 font-semibold">{dashboardStats.losingTrades} Losses</span>
                <span>/</span>
                <span className="text-gray-400">{dashboardStats.breakevenTrades} BE</span>
              </div>
            </div>
          </div>

          {/* Card 3: Profit Factor & Expectancy */}
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A0A6AE]">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Profit Factor</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-bold tracking-tight text-[#F5F5F5]">
                {dashboardStats.profitFactor}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#6F7680] mt-1">
                Expectancy: <span className="text-emerald-400 font-medium">${dashboardStats.expectancy}/trade</span>
              </div>
            </div>
          </div>

          {/* Card 4: Avg Risk:Reward */}
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A0A6AE]">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Avg Risk : Reward</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-bold tracking-tight text-[#F5F5F5]">
                1 : {dashboardStats.avgRiskReward}R
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#6F7680] mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Avg Win: <strong className="text-emerald-400">+${dashboardStats.avgWin}</strong></span>
                <span>•</span>
                <span>Avg Loss: <strong className="text-red-400">-${dashboardStats.avgLoss}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-[#1B1F24] border border-[#292D33] rounded-lg p-2.5 sm:p-3">
            <span className="text-[9px] sm:text-[10px] text-[#6F7680] uppercase tracking-wider block font-semibold">
              Total Trades
            </span>
            <span className="text-sm sm:text-base font-bold text-[#F5F5F5]">{dashboardStats.totalTrades}</span>
            <span className="text-[9px] sm:text-[10px] text-[#A0A6AE] ml-1 sm:ml-2">({dashboardStats.openTrades} Open)</span>
          </div>

          <div className="bg-[#1B1F24] border border-[#292D33] rounded-lg p-2.5 sm:p-3">
            <span className="text-[9px] sm:text-[10px] text-[#6F7680] uppercase tracking-wider block font-semibold">
              Max Drawdown
            </span>
            <span className="text-sm sm:text-base font-bold text-red-400 block truncate">
              -${dashboardStats.maxDrawdown.toLocaleString()} ({dashboardStats.maxDrawdownPercent}%)
            </span>
          </div>

          <div className="bg-[#1B1F24] border border-[#292D33] rounded-lg p-2.5 sm:p-3">
            <span className="text-[9px] sm:text-[10px] text-[#6F7680] uppercase tracking-wider block font-semibold">
              Best Trade
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 block truncate">
              {dashboardStats.bestTrade ? `+$${dashboardStats.bestTrade.netPL.toLocaleString()}` : '$0'}
            </span>
          </div>

          <div className="bg-[#1B1F24] border border-[#292D33] rounded-lg p-2.5 sm:p-3">
            <span className="text-[9px] sm:text-[10px] text-[#6F7680] uppercase tracking-wider block font-semibold">
              Max Win Streak
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-400">
              {dashboardStats.winStreak} Wins
            </span>
          </div>
        </div>

        {/* Interactive Equity Curve Section */}
        <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-3.5 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Account Equity & Growth Curve</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[#A0A6AE]">
                Cumulative performance progression over selected period
              </p>
            </div>

            {/* Chart View Toggle */}
            <div className="flex items-center gap-1 bg-[#1B1F24] border border-[#292D33] p-1 rounded-lg text-xs overflow-x-auto max-w-full">
              <button
                onClick={() => setCurveType('equity')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
                  curveType === 'equity'
                    ? 'bg-emerald-600 text-white'
                    : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
                }`}
              >
                Account Equity
              </button>
              <button
                onClick={() => setCurveType('pl')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
                  curveType === 'pl'
                    ? 'bg-emerald-600 text-white'
                    : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
                }`}
              >
                Cumulative P/L
              </button>
              <button
                onClick={() => setCurveType('r')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
                  curveType === 'r'
                    ? 'bg-emerald-600 text-white'
                    : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
                }`}
              >
                R-Multiple
              </button>
            </div>
          </div>

          {/* Recharts Area Chart - Explicit Fixed Height on Direct Parent */}
          <div className="h-60 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292D33" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#6F7680"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#292D33' }}
                />
                <YAxis
                  stroke="#6F7680"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#292D33' }}
                  tickFormatter={(val) =>
                    curveType === 'r' ? `${val}R` : `$${val.toLocaleString()}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1B1F24',
                    borderColor: '#292D33',
                    borderRadius: '8px',
                    color: '#F5F5F5',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === 'equity') return [`$${Number(value).toLocaleString()}`, 'Account Equity'];
                    if (name === 'cumulativePL') return [`$${Number(value).toLocaleString()}`, 'Cumulative P/L'];
                    if (name === 'rMultiple') return [`${value} R`, 'R Multiple'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Date/Time: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey={
                    curveType === 'equity' ? 'equity' : curveType === 'pl' ? 'cumulativePL' : 'rMultiple'
                  }
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGreen)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Trades Table Preview */}
        <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-3.5 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#F5F5F5]">Recent Recorded Trades</h2>
              <p className="text-[11px] sm:text-xs text-[#A0A6AE]">Latest trading journal entries</p>
            </div>

            <button
              onClick={() => setIsAddTradeOpen(true)}
              className="py-1.5 px-2.5 sm:px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Trade</span>
            </button>
          </div>

          {filteredTrades.length === 0 ? (
            <div className="py-12 text-center text-[#6F7680]">
              <p className="text-sm">No trades recorded for this period.</p>
              <button
                onClick={() => setIsAddTradeOpen(true)}
                className="mt-3 py-2 px-4 rounded-lg bg-emerald-600 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Your First Trade</span>
              </button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto max-w-full">
              <table className="w-full text-left text-xs text-[#F5F5F5] min-w-[550px]">
                <thead className="bg-[#1B1F24] text-[#6F7680] uppercase tracking-wider font-semibold border-b border-[#292D33]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Pair</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Entry</th>
                    <th className="py-2.5 px-3">Exit</th>
                    <th className="py-2.5 px-3">Net P/L</th>
                    <th className="py-2.5 px-3">Realized R:R</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292D33]">
                  {filteredTrades.slice(0, 5).map((trade) => {
                    const isWin = trade.outcome === 'WIN';
                    const isLoss = trade.outcome === 'LOSS';
                    return (
                      <tr key={trade.id} className="hover:bg-[#1B1F24]/50 transition-colors">
                        <td className="py-3 px-3 text-[#A0A6AE]">
                          {trade.date} <span className="text-[#6F7680]">{trade.time}</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#F5F5F5]">{trade.symbol}</td>
                        <td className="py-3 px-3">
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
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isWin
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isLoss
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                            }`}
                          >
                            {trade.outcome}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#A0A6AE]">{trade.entry}</td>
                        <td className="py-3 px-3 text-[#A0A6AE]">{trade.exitPrice || '-'}</td>
                        <td className="py-3 px-3 font-bold">
                          <span className={trade.netPL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {trade.netPL >= 0 ? '+' : ''}${trade.netPL.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#F5F5F5]">
                          {trade.realizedRR}R
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedTradeDetail(trade)}
                            className="p-1.5 rounded bg-[#1B1F24] hover:bg-[#22272E] text-[#A0A6AE] hover:text-[#F5F5F5] border border-[#292D33] cursor-pointer"
                            title="View Full Trade Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
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
