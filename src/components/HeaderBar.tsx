import React from 'react';
import { useJournal } from '../context/JournalContext';
import { DateRangeFilter } from '../types';
import { Calendar, Filter, Plus, Wallet } from 'lucide-react';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ title, subtitle }) => {
  const {
    accounts,
    activeAccountId,
    setActiveAccountId,
    dateRangeFilter,
    setDateRangeFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    setIsAddTradeOpen,
    dashboardStats,
  } = useJournal();

  const isPositive = dashboardStats.totalPL >= 0;

  return (
    <div className="bg-[#15181D] border-b border-[#292D33] px-4 py-4 md:px-6 md:py-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Page Title & P/L Chip */}
        <div className="flex items-center justify-between lg:justify-start gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#F5F5F5]">{title}</h1>
            {subtitle && <p className="text-xs text-[#A0A6AE] mt-0.5">{subtitle}</p>}
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
              isPositive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <span>Period P/L:</span>
            <span className="font-bold">
              {isPositive ? '+' : ''}${dashboardStats.totalPL.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Account Selector & Date Range Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Account Filter */}
          <div className="flex items-center gap-1.5 bg-[#1B1F24] border border-[#292D33] rounded-lg px-2.5 py-1.5 text-xs text-[#A0A6AE]">
            <Wallet className="w-3.5 h-3.5 text-[#6F7680]" />
            <select
              value={activeAccountId}
              onChange={(e) => setActiveAccountId(e.target.value)}
              className="bg-transparent text-[#F5F5F5] focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#15181D]">
                All Accounts
              </option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-[#15181D]">
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-[#1B1F24] border border-[#292D33] rounded-lg px-2.5 py-1.5 text-xs text-[#A0A6AE]">
            <Calendar className="w-3.5 h-3.5 text-[#6F7680]" />
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as DateRangeFilter)}
              className="bg-transparent text-[#F5F5F5] focus:outline-none cursor-pointer pr-1"
            >
              <option value="today" className="bg-[#15181D]">
                Today
              </option>
              <option value="this_week" className="bg-[#15181D]">
                This Week
              </option>
              <option value="this_month" className="bg-[#15181D]">
                This Month
              </option>
              <option value="last_month" className="bg-[#15181D]">
                Last Month
              </option>
              <option value="3m" className="bg-[#15181D]">
                Last 3 Months
              </option>
              <option value="6m" className="bg-[#15181D]">
                Last 6 Months
              </option>
              <option value="ytd" className="bg-[#15181D]">
                Year to Date
              </option>
              <option value="all" className="bg-[#15181D]">
                All Time
              </option>
              <option value="custom" className="bg-[#15181D]">
                Custom Range
              </option>
            </select>
          </div>

          {/* Custom Date Inputs if Custom is selected */}
          {dateRangeFilter === 'custom' && (
            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[#6F7680]">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Record Trade Action */}
          <button
            onClick={() => setIsAddTradeOpen(true)}
            className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Trade</span>
          </button>
        </div>
      </div>
    </div>
  );
};
