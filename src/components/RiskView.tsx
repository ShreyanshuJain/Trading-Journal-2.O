import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { HeaderBar } from './HeaderBar';
import { ShieldAlert, DollarSign, Percent, AlertCircle, CheckCircle, Calculator, Info } from 'lucide-react';

export const RiskView: React.FC = () => {
  const { dashboardStats, activeAccount, settings, updateSettings } = useJournal();

  // Position Sizing Calculator State
  const [accountBalanceInput, setAccountBalanceInput] = useState<number>(activeAccount ? activeAccount.currentBalance : 50000);
  const [riskPercentInput, setRiskPercentInput] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number>(100);
  const [stopLossPrice, setStopLossPrice] = useState<number>(98);

  // Position Calc Results
  const riskAmount = (accountBalanceInput * riskPercentInput) / 100;
  const stopDistance = Math.abs(entryPrice - stopLossPrice);
  const calculatedUnits = stopDistance > 0 ? (riskAmount / stopDistance).toFixed(2) : '0';

  const [maxRiskPerTrade, setMaxRiskPerTrade] = useState(settings.riskManagement?.maxRiskPerTradePercent || 2);
  const [dailyLossLimit, setDailyLossLimit] = useState(settings.riskManagement?.dailyLossLimitDollar || 1000);

  const handleSaveRiskRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      riskManagement: {
        maxRiskPerTradePercent: maxRiskPerTrade,
        dailyLossLimitDollar: dailyLossLimit,
        maxOpenPositions: 3,
        requireStopLoss: true,
      },
    });
  };

  return (
    <div>
      <HeaderBar
        title="Risk Management & Calculator"
        subtitle="Enforce capital protection parameters, drawdown limits, and position sizing models"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Rules & Health Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-4">
              <div className="flex items-center justify-between text-[#6F7680] mb-2">
                <span className="text-xs">Max Risk / Trade</span>
                <Percent className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-[#F5F5F5]">{maxRiskPerTrade}%</p>
              <span className="text-[10px] text-[#A0A6AE] mt-1 block">
                Max ${((accountBalanceInput * maxRiskPerTrade) / 100).toLocaleString()} per trade
              </span>
            </div>

            <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-4">
              <div className="flex items-center justify-between text-[#6F7680] mb-2">
                <span className="text-xs">Max Daily Drawdown</span>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-bold text-[#F5F5F5]">${dailyLossLimit.toLocaleString()}</p>
              <span className="text-[10px] text-[#A0A6AE] mt-1 block">hard circuit breaker</span>
            </div>

            <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-4">
              <div className="flex items-center justify-between text-[#6F7680] mb-2">
                <span className="text-xs">Profit Factor</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-emerald-400">{dashboardStats.profitFactor.toFixed(2)}</p>
              <span className="text-[10px] text-[#A0A6AE] mt-1 block">Gross Win / Gross Loss</span>
            </div>
          </div>

          {/* Risk Management Settings Form */}
          <form onSubmit={handleSaveRiskRules} className="bg-[#15181D] border border-[#292D33] rounded-xl p-6">
            <h2 className="text-lg font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <span>Risk Policy Rules</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-[#A0A6AE] block mb-1">Max Risk per Trade (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={maxRiskPerTrade}
                  onChange={(e) => setMaxRiskPerTrade(Number(e.target.value))}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-[#A0A6AE] block mb-1">Daily Loss Limit ($)</label>
                <input
                  type="number"
                  value={dailyLossLimit}
                  onChange={(e) => setDailyLossLimit(Number(e.target.value))}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save Risk Rules</span>
            </button>
          </form>
        </div>

        {/* Live Position Size Calculator */}
        <div className="space-y-6">
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-6">
            <h2 className="text-lg font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <span>Position Size Calculator</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#A0A6AE] block mb-1">Account Balance ($)</label>
                <input
                  type="number"
                  value={accountBalanceInput}
                  onChange={(e) => setAccountBalanceInput(Number(e.target.value))}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-[#A0A6AE] block mb-1">Risk per Trade (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={riskPercentInput}
                  onChange={(e) => setRiskPercentInput(Number(e.target.value))}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#A0A6AE] block mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#A0A6AE] block mb-1">Stop Loss Price</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(Number(e.target.value))}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Calc Results */}
              <div className="bg-[#1B1F24] border border-[#292D33] rounded-lg p-4 space-y-2 mt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#A0A6AE]">Max Risk Amount:</span>
                  <span className="font-bold text-red-400">${riskAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#A0A6AE]">Stop Distance:</span>
                  <span className="font-mono text-[#F5F5F5]">{stopDistance.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-[#292D33]">
                  <span className="font-semibold text-[#F5F5F5]">Position Size (Units / Lots):</span>
                  <span className="font-bold text-emerald-400 text-base">{calculatedUnits}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
