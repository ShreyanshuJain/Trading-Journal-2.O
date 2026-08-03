import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { HeaderBar } from './HeaderBar';
import { Wallet, Plus, Trash2, Edit2, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export const AccountsView: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, trades, resetDemoData } = useJournal();

  const [name, setName] = useState('');
  const [broker, setBroker] = useState('');
  const [startingBalance, setStartingBalance] = useState<number>(10000);
  const [type, setType] = useState<'Live' | 'Prop Firm' | 'Demo' | 'Paper'>('Prop Firm');
  const [currency, setCurrency] = useState('USD');

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addAccount({
      name: name.trim(),
      broker: broker.trim() || 'Generic Broker',
      accountType: type,
      startingBalance: Number(startingBalance),
      currentBalance: Number(startingBalance),
      currency,
    });
    setName('');
    setBroker('');
    setStartingBalance(10000);
  };

  return (
    <div>
      <HeaderBar
        title="Trading Accounts"
        subtitle="Manage live accounts, prop firm evaluations, funded accounts, and starting balances"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Cards List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => {
              const accTrades = trades.filter((t) => t.accountId === acc.id);
              const netPL = accTrades.reduce((sum, t) => sum + t.netPL, 0);
              const plPercent = acc.startingBalance > 0 ? (netPL / acc.startingBalance) * 100 : 0;
              const isProfit = netPL >= 0;

              return (
                <div
                  key={acc.id}
                  className="bg-[#15181D] border border-[#292D33] rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-[#3A3F47] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#F5F5F5]">{acc.name}</span>
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {acc.accountType}
                        </span>
                      </div>
                      <p className="text-xs text-[#A0A6AE] mt-0.5">{acc.broker}</p>
                    </div>

                    <button
                      onClick={() => deleteAccount(acc.id)}
                      className="text-[#6F7680] hover:text-red-400 cursor-pointer transition-colors p-1"
                      title="Delete Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Balances */}
                  <div className="bg-[#1B1F24] border border-[#292D33] rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#6F7680]">Current Balance</span>
                      <span className="text-lg font-bold text-[#F5F5F5]">
                        ${acc.currentBalance.toLocaleString()} {acc.currency}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-[#292D33]/60">
                      <span className="text-[#6F7680]">Total Net P/L</span>
                      <span className={`font-semibold flex items-center gap-1 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isProfit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isProfit ? '+' : ''}${netPL.toLocaleString()} ({plPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#A0A6AE]">
                    <span>Trades Logged: {accTrades.length}</span>
                    <span>Start: ${acc.startingBalance.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-[#15181D] border border-[#292D33] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-semibold text-[#F5F5F5]">Reset Demo Data</h4>
                <p className="text-xs text-[#A0A6AE]">Restore clean pre-populated trades and accounts for demonstration</p>
              </div>
            </div>
            <button
              onClick={resetDemoData}
              className="px-3 py-1.5 rounded-lg bg-[#1B1F24] hover:bg-[#22272E] border border-[#292D33] text-xs font-medium text-[#F5F5F5] cursor-pointer transition-all"
            >
              Reset Data
            </button>
          </div>
        </div>

        {/* Create Account Form */}
        <div>
          <form onSubmit={handleAddAccount} className="bg-[#15181D] border border-[#292D33] rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#F5F5F5] mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Add Trading Account</span>
            </h2>

            <div>
              <label className="text-xs text-[#A0A6AE] block mb-1">Account Name</label>
              <input
                type="text"
                placeholder="e.g. FTMO 100k Challenge"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-[#A0A6AE] block mb-1">Broker / Firm</label>
              <input
                type="text"
                placeholder="e.g. Interactive Brokers, FTMO, OANDA"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#A0A6AE] block mb-1">Account Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Prop Firm">Prop Firm</option>
                  <option value="Live">Live Personal</option>
                  <option value="Demo">Demo</option>
                  <option value="Paper">Paper</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#A0A6AE] block mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#A0A6AE] block mb-1">Starting Balance ($)</label>
              <input
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(Number(e.target.value))}
                className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
