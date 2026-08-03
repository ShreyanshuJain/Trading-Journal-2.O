import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { HeaderBar } from './HeaderBar';
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Layers,
  Calendar,
  Globe,
  Newspaper,
  ShieldAlert,
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
    dashboardStats,
    equityCurveData,
    strategyStats,
    pairStats,
    sessionStats,
    dayOfWeekStats,
    newsStats,
  } = useJournal();

  const [activeTab, setActiveTab] = useState<'overview' | 'strategies' | 'pairs' | 'sessions' | 'days' | 'news'>('overview');
  const [curveType, setCurveType] = useState<'equity' | 'pl' | 'r'>('pl');

  // Best/Worst Strategy highlight
  const bestStrategy = [...strategyStats].sort((a, b) => b.netPL - a.netPL)[0];
  const worstStrategy = [...strategyStats].sort((a, b) => a.netPL - b.netPL)[0];

  return (
    <div className="pb-20 lg:pb-12">
      <HeaderBar
        title="Performance Analytics & Statistics"
        subtitle="In-depth quantitative analytics breakdown across strategies, instruments, sessions, and economic news releases."
      />

      <div className="px-4 md:px-6 space-y-6">
        {/* Navigation Tabs for Analytics */}
        <div className="flex border-b border-[#292D33] bg-[#15181D] p-2 rounded-xl overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab('strategies')}
            className={`py-2 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'strategies'
                ? 'bg-emerald-600 text-white'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            Strategy Analytics
          </button>
          <button
            onClick={() => setActiveTab('pairs')}
            className={`py-2 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pairs'
                ? 'bg-emerald-600 text-white'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            Pair Analytics
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sessions'
                ? 'bg-emerald-600 text-white'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            Session Analytics
          </button>
          <button
            onClick={() => setActiveTab('days')}
            className={`py-2 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'days'
                ? 'bg-emerald-600 text-white'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            Day-of-Week Analytics
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`py-2 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'news'
                ? 'bg-emerald-600 text-white'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            News Event Analytics
          </button>
        </div>

        {/* TAB 1: OVERVIEW & COMPREHENSIVE METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Primary KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-[#15181D] border border-[#292D33] p-3.5 rounded-xl">
                <span className="text-[10px] text-[#6F7680] uppercase font-bold block">Net P/L</span>
                <span className={`text-lg font-bold ${dashboardStats.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {dashboardStats.totalPL >= 0 ? '+' : ''}${dashboardStats.totalPL.toLocaleString()}
                </span>
              </div>

              <div className="bg-[#15181D] border border-[#292D33] p-3.5 rounded-xl">
                <span className="text-[10px] text-[#6F7680] uppercase font-bold block">Win Rate</span>
                <span className="text-lg font-bold text-[#F5F5F5]">{dashboardStats.winRate}%</span>
              </div>

              <div className="bg-[#15181D] border border-[#292D33] p-3.5 rounded-xl">
                <span className="text-[10px] text-[#6F7680] uppercase font-bold block">Profit Factor</span>
                <span className="text-lg font-bold text-[#F5F5F5]">{dashboardStats.profitFactor}</span>
              </div>

              <div className="bg-[#15181D] border border-[#292D33] p-3.5 rounded-xl">
                <span className="text-[10px] text-[#6F7680] uppercase font-bold block">Expectancy</span>
                <span className="text-lg font-bold text-emerald-400">${dashboardStats.expectancy}</span>
              </div>

              <div className="bg-[#15181D] border border-[#292D33] p-3.5 rounded-xl">
                <span className="text-[10px] text-[#6F7680] uppercase font-bold block">Avg Risk : Reward</span>
                <span className="text-lg font-bold text-[#F5F5F5]">1 : {dashboardStats.avgRiskReward}R</span>
              </div>

              <div className="bg-[#15181D] border border-[#292D33] p-3.5 rounded-xl">
                <span className="text-[10px] text-[#6F7680] uppercase font-bold block">Max Drawdown</span>
                <span className="text-lg font-bold text-red-400">-{dashboardStats.maxDrawdownPercent}%</span>
              </div>
            </div>

            {/* Interactive Equity Curve Chart */}
            <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <h3 className="font-bold text-[#F5F5F5] text-sm">Equity & Cumulative Return Curve</h3>
                <div className="flex items-center gap-1 bg-[#1B1F24] border border-[#292D33] p-1 rounded-lg text-xs">
                  <button
                    onClick={() => setCurveType('pl')}
                    className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                      curveType === 'pl' ? 'bg-emerald-600 text-white' : 'text-[#A0A6AE]'
                    }`}
                  >
                    Cumulative P/L
                  </button>
                  <button
                    onClick={() => setCurveType('equity')}
                    className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                      curveType === 'equity' ? 'bg-emerald-600 text-white' : 'text-[#A0A6AE]'
                    }`}
                  >
                    Account Equity
                  </button>
                  <button
                    onClick={() => setCurveType('r')}
                    className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                      curveType === 'r' ? 'bg-emerald-600 text-white' : 'text-[#A0A6AE]'
                    }`}
                  >
                    R-Multiple
                  </button>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurveData}>
                    <defs>
                      <linearGradient id="curveColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292D33" vertical={false} />
                    <XAxis dataKey="date" stroke="#6F7680" fontSize={11} />
                    <YAxis stroke="#6F7680" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1B1F24',
                        borderColor: '#292D33',
                        color: '#F5F5F5',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={curveType === 'equity' ? 'equity' : curveType === 'pl' ? 'cumulativePL' : 'rMultiple'}
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="url(#curveColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Streaks & Trade Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-[#F5F5F5] text-xs uppercase tracking-wider">Trading Streaks</h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-[#1B1F24] p-3 rounded-lg border border-emerald-500/30">
                    <span className="text-[10px] text-[#6F7680] uppercase block">Max Winning Streak</span>
                    <span className="text-xl font-bold text-emerald-400">{dashboardStats.winStreak} Wins</span>
                  </div>
                  <div className="bg-[#1B1F24] p-3 rounded-lg border border-red-500/30">
                    <span className="text-[10px] text-[#6F7680] uppercase block">Max Losing Streak</span>
                    <span className="text-xl font-bold text-red-400">{dashboardStats.lossStreak} Losses</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-[#F5F5F5] text-xs uppercase tracking-wider">Best vs Worst Trade</h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-[#1B1F24] p-3 rounded-lg border border-emerald-500/30">
                    <span className="text-[10px] text-[#6F7680] uppercase block">Best Single Trade</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {dashboardStats.bestTrade ? `+$${dashboardStats.bestTrade.netPL.toLocaleString()}` : '$0'}
                    </span>
                  </div>
                  <div className="bg-[#1B1F24] p-3 rounded-lg border border-red-500/30">
                    <span className="text-[10px] text-[#6F7680] uppercase block">Worst Single Trade</span>
                    <span className="text-xl font-bold text-red-400">
                      {dashboardStats.worstTrade ? `-$${Math.abs(dashboardStats.worstTrade.netPL).toLocaleString()}` : '$0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STRATEGY ANALYTICS */}
        {activeTab === 'strategies' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bestStrategy && (
                <div className="bg-[#15181D] border border-emerald-500/40 rounded-xl p-4 flex items-center gap-3">
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
                <div className="bg-[#15181D] border border-red-500/40 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-red-400 font-bold uppercase block">Lowest Performing Strategy</span>
                    <h4 className="font-bold text-[#F5F5F5] text-base">{worstStrategy.strategyName}</h4>
                    <p className="text-xs text-[#A0A6AE]">
                      Net P/L: <strong className="text-red-400">${worstStrategy.netPL.toLocaleString()}</strong> ({worstStrategy.winRate}% Win Rate)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#15181D] border border-[#292D33] rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-[#292D33]">
                <h3 className="font-bold text-[#F5F5F5] text-sm">Strategy Performance Matrix</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#F5F5F5]">
                  <thead className="bg-[#1B1F24] text-[#6F7680] uppercase tracking-wider font-semibold border-b border-[#292D33]">
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
                  <tbody className="divide-y divide-[#292D33]">
                    {strategyStats.map((st) => (
                      <tr key={st.strategyId} className="hover:bg-[#1B1F24]/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#F5F5F5] flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }} />
                          <span>{st.strategyName}</span>
                        </td>
                        <td className="py-3 px-4">{st.totalTrades}</td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-400 font-bold">{st.wins}W</span>
                          <span className="text-[#6F7680]"> / </span>
                          <span className="text-red-400 font-bold">{st.losses}L</span>
                        </td>
                        <td className="py-3 px-4 font-bold">{st.winRate}%</td>
                        <td className="py-3 px-4">{st.avgRR}R</td>
                        <td className="py-3 px-4 font-bold">{st.profitFactor}</td>
                        <td className="py-3 px-4 font-bold">
                          <span className={st.netPL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
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

        {/* TAB 3: PAIR ANALYTICS */}
        {activeTab === 'pairs' && (
          <div className="space-y-6">
            <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-5">
              <h3 className="font-bold text-[#F5F5F5] text-sm mb-4">P/L Distribution by Instrument / Pair</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pairStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292D33" vertical={false} />
                    <XAxis dataKey="symbol" stroke="#6F7680" fontSize={11} />
                    <YAxis stroke="#6F7680" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1B1F24', borderColor: '#292D33', color: '#F5F5F5' }}
                    />
                    <Bar dataKey="netPL" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#15181D] border border-[#292D33] rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-[#F5F5F5]">
                <thead className="bg-[#1B1F24] text-[#6F7680] uppercase tracking-wider font-semibold border-b border-[#292D33]">
                  <tr>
                    <th className="py-3 px-4">Pair / Symbol</th>
                    <th className="py-3 px-4">Trades</th>
                    <th className="py-3 px-4">Win Rate</th>
                    <th className="py-3 px-4">Avg R:R</th>
                    <th className="py-3 px-4">Profit Factor</th>
                    <th className="py-3 px-4">Net P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292D33]">
                  {pairStats.map((p) => (
                    <tr key={p.symbol} className="hover:bg-[#1B1F24]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#F5F5F5]">{p.symbol}</td>
                      <td className="py-3 px-4">{p.totalTrades}</td>
                      <td className="py-3 px-4 font-bold">{p.winRate}%</td>
                      <td className="py-3 px-4">{p.avgRR}R</td>
                      <td className="py-3 px-4 font-bold">{p.profitFactor}</td>
                      <td className="py-3 px-4 font-bold">
                        <span className={p.netPL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
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

        {/* TAB 4: SESSION ANALYTICS */}
        {activeTab === 'sessions' && (
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#292D33]">
              <h3 className="font-bold text-[#F5F5F5] text-sm">Trading Session Performance Breakdown</h3>
            </div>
            <table className="w-full text-left text-xs text-[#F5F5F5]">
              <thead className="bg-[#1B1F24] text-[#6F7680] uppercase tracking-wider font-semibold border-b border-[#292D33]">
                <tr>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Trades</th>
                  <th className="py-3 px-4">Win Rate</th>
                  <th className="py-3 px-4">Avg R:R</th>
                  <th className="py-3 px-4">Net P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292D33]">
                {sessionStats.map((s) => (
                  <tr key={s.session} className="hover:bg-[#1B1F24]/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#F5F5F5]">{s.session}</td>
                    <td className="py-3 px-4">{s.totalTrades}</td>
                    <td className="py-3 px-4 font-bold">{s.winRate}%</td>
                    <td className="py-3 px-4">{s.avgRR}R</td>
                    <td className="py-3 px-4 font-bold">
                      <span className={s.netPL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {s.netPL >= 0 ? '+' : ''}${s.netPL.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: DAY-OF-WEEK ANALYTICS */}
        {activeTab === 'days' && (
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-[#F5F5F5] text-sm">Performance by Day of Week</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {dayOfWeekStats.map((d) => (
                <div key={d.day} className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-4 text-center">
                  <span className="text-xs font-bold text-[#A0A6AE] uppercase block mb-1">{d.day}</span>
                  <span className={`text-base font-bold ${d.netPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {d.netPL >= 0 ? '+' : ''}${d.netPL.toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-[#6F7680] mt-1">
                    {d.totalTrades} Trades • {d.winRate}% WR
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: NEWS EVENT ANALYTICS */}
        {activeTab === 'news' && (
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#292D33]">
              <h3 className="font-bold text-[#F5F5F5] text-sm">Economic News Catalyst Performance</h3>
            </div>
            {newsStats.length === 0 ? (
              <div className="p-12 text-center text-[#6F7680] text-xs">
                No news-based trades recorded yet. Assign news event tags when recording trades.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-[#F5F5F5]">
                <thead className="bg-[#1B1F24] text-[#6F7680] uppercase tracking-wider font-semibold border-b border-[#292D33]">
                  <tr>
                    <th className="py-3 px-4">News Catalyst</th>
                    <th className="py-3 px-4">Trades</th>
                    <th className="py-3 px-4">Wins / Losses</th>
                    <th className="py-3 px-4">Win Rate</th>
                    <th className="py-3 px-4">Net P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292D33]">
                  {newsStats.map((n) => (
                    <tr key={n.newsEvent} className="hover:bg-[#1B1F24]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#F5F5F5]">{n.newsEvent}</td>
                      <td className="py-3 px-4">{n.totalTrades}</td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-bold">{n.wins}W</span> /{' '}
                        <span className="text-red-400 font-bold">{n.losses}L</span>
                      </td>
                      <td className="py-3 px-4 font-bold">{n.winRate}%</td>
                      <td className="py-3 px-4 font-bold">
                        <span className={n.netPL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
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
