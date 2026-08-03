import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { HeaderBar } from './HeaderBar';
import {
  Wallet,
  Layers,
  ShieldAlert,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Settings as SettingsIcon,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    accounts,
    strategies,
    settings,
    addAccount,
    updateAccount,
    addStrategy,
    updateSettings,
    exportDataJSON,
    exportDataCSV,
    importDataJSON,
    resetToDemoData,
  } = useJournal();

  const [activeTab, setActiveTab] = useState<'accounts' | 'strategies' | 'risk' | 'data'>('accounts');

  // New Account State
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccBalance, setNewAccBalance] = useState<number>(50000);
  const [newAccCurrency, setNewAccCurrency] = useState<string>('USD');

  // New Strategy State
  const [newStratName, setNewStratName] = useState<string>('');
  const [newStratDesc, setNewStratDesc] = useState<string>('');
  const [newStratColor, setNewStratColor] = useState<string>('#10B981');

  // Risk Rules State
  const [maxDailyLoss, setMaxDailyLoss] = useState<number>(settings.maxDailyLossPercent);
  const [maxPositionRisk, setMaxPositionRisk] = useState<number>(settings.maxPositionRiskPercent);
  const [maxDrawdown, setMaxDrawdown] = useState<number>(settings.maxDrawdownPercent);
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState<number>(settings.maxConsecutiveLosses);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    addAccount({
      name: newAccName.trim(),
      currency: newAccCurrency,
      initialBalance: Number(newAccBalance),
      currentBalance: Number(newAccBalance),
    });
    setNewAccName('');
    setNewAccBalance(50000);
  };

  const handleCreateStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStratName.trim()) return;
    addStrategy({
      name: newStratName.trim(),
      description: newStratDesc.trim(),
      color: newStratColor,
    });
    setNewStratName('');
    setNewStratDesc('');
  };

  const handleSaveRiskSettings = () => {
    updateSettings({
      maxDailyLossPercent: maxDailyLoss,
      maxPositionRiskPercent: maxPositionRisk,
      maxDrawdownPercent: maxDrawdown,
      maxConsecutiveLosses,
    });
    alert('Risk management parameters updated successfully!');
  };

  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = importDataJSON(content);
        if (success) {
          alert('Journal data imported successfully!');
        } else {
          alert('Failed to parse invalid JSON file format.');
        }
      } catch (err) {
        alert('Error parsing import file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pb-20 lg:pb-12">
      <HeaderBar
        title="Journal Settings & Preferences"
        subtitle="Manage accounts, trading strategies, custom risk limits, and journal backups."
      />

      <div className="px-4 md:px-6 space-y-6">
        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-[#292D33] bg-[#15181D] p-2 rounded-xl overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-2 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'accounts'
                ? 'bg-emerald-600 text-white'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Trading Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab('strategies')}
            className={`py-2 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'strategies'
                ? 'bg-emerald-600 text-white'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Strategies & Playbooks</span>
          </button>

          <button
            onClick={() => setActiveTab('risk')}
            className={`py-2 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'risk'
                ? 'bg-emerald-600 text-white'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Risk Management Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`py-2 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'bg-emerald-600 text-white'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export & Backup</span>
          </button>
        </div>

        {/* TAB 1: ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-[#F5F5F5] text-sm">Create New Trading Account</h3>
              <form onSubmit={handleCreateAccount} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Account Name (e.g. FTMO 100K Challenge)"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Starting Balance ($)"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(parseFloat(e.target.value) || 0)}
                  className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  required
                />
                <select
                  value={newAccCurrency}
                  onChange={(e) => setNewAccCurrency(e.target.value)}
                  className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Account</span>
                </button>
              </form>
            </div>

            {/* Existing Accounts List */}
            <div className="bg-[#15181D] border border-[#292D33] rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-[#292D33]">
                <h3 className="font-bold text-[#F5F5F5] text-sm">Active Trading Accounts</h3>
              </div>
              <div className="divide-y divide-[#292D33]">
                {accounts.map((acc) => (
                  <div key={acc.id} className="p-4 flex items-center justify-between hover:bg-[#1B1F24]/50 transition-colors">
                    <div>
                      <h4 className="font-bold text-[#F5F5F5] text-sm">{acc.name}</h4>
                      <p className="text-xs text-[#A0A6AE]">
                        Currency: {acc.currency} • Initial: ${(acc.initialBalance ?? 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-[#6F7680] uppercase block font-semibold">Current Balance</span>
                      <span className="text-base font-bold text-emerald-400">
                        ${(acc.currentBalance ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STRATEGIES */}
        {activeTab === 'strategies' && (
          <div className="space-y-6">
            <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-[#F5F5F5] text-sm">Create New Strategy / Playbook</h3>
              <form onSubmit={handleCreateStrategy} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Strategy Name (e.g. Silver Bullet 10am)"
                    value={newStratName}
                    onChange={(e) => setNewStratName(e.target.value)}
                    className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3 py-2 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description / Setup Rules..."
                    value={newStratDesc}
                    onChange={(e) => setNewStratDesc(e.target.value)}
                    className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3 py-2 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newStratColor}
                      onChange={(e) => setNewStratColor(e.target.value)}
                      className="w-10 h-9 rounded bg-[#1B1F24] border border-[#292D33] cursor-pointer"
                    />
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Save Strategy</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategies.map((st) => (
                <div key={st.id} className="bg-[#15181D] border border-[#292D33] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }} />
                      <h4 className="font-bold text-[#F5F5F5] text-sm">{st.name}</h4>
                    </div>
                  </div>
                  {st.description && <p className="text-xs text-[#A0A6AE]">{st.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RISK MANAGEMENT RULES */}
        {activeTab === 'risk' && (
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-6 space-y-6">
            <div className="border-b border-[#292D33] pb-3">
              <h3 className="font-bold text-[#F5F5F5] text-base">Account Risk & Capital Protection Rules</h3>
              <p className="text-xs text-[#A0A6AE]">
                Set strict quantitative limits to maintain drawdown control and protect funded accounts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">
                  Max Daily Loss Limit (%)
                </label>
                <input
                  type="number"
                  step="any"
                  value={maxDailyLoss}
                  onChange={(e) => setMaxDailyLoss(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">
                  Max Single Position Risk (%)
                </label>
                <input
                  type="number"
                  step="any"
                  value={maxPositionRisk}
                  onChange={(e) => setMaxPositionRisk(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">
                  Max Account Drawdown Limit (%)
                </label>
                <input
                  type="number"
                  step="any"
                  value={maxDrawdown}
                  onChange={(e) => setMaxDrawdown(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">
                  Max Consecutive Losses Before Cooldown
                </label>
                <input
                  type="number"
                  value={maxConsecutiveLosses}
                  onChange={(e) => setMaxConsecutiveLosses(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={handleSaveRiskSettings}
                className="py-2.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" />
                <span>Save Risk Limits</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: DATA EXPORT & IMPORT */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-[#F5F5F5] text-base">Export Journal Data</h3>
              <p className="text-xs text-[#A0A6AE]">
                Download a complete backup of your trades, screenshots, psychology logs, and statistics.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={exportDataJSON}
                  className="py-2.5 px-4 rounded-lg bg-[#1B1F24] border border-[#292D33] hover:bg-[#292D33] text-[#F5F5F5] font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export JSON Backup</span>
                </button>

                <button
                  onClick={exportDataCSV}
                  className="py-2.5 px-4 rounded-lg bg-[#1B1F24] border border-[#292D33] hover:bg-[#292D33] text-[#F5F5F5] font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export Trades CSV</span>
                </button>
              </div>
            </div>

            <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-[#F5F5F5] text-base">Import & Restore Backup</h3>
              <p className="text-xs text-[#A0A6AE]">
                Upload a previously saved Trading Journal JSON file to restore your entire database.
              </p>

              <label className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>Select JSON Backup File</span>
                <input type="file" accept=".json" onChange={handleJSONImport} className="hidden" />
              </label>
            </div>

            <div className="bg-[#15181D] border border-red-500/30 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-red-400 text-base">Reset to Sample Demo Trades</h3>
              <p className="text-xs text-[#A0A6AE]">
                Wipe current local storage data and re-populate with pre-loaded demo trades, setups, and statistics.
              </p>

              <button
                onClick={() => {
                  resetToDemoData();
                }}
                className="py-2.5 px-4 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Demo Data</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
