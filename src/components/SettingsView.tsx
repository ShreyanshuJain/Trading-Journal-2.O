import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { HeaderBar } from './HeaderBar';
import { uploadToCloudinary } from '../utils/imageUtils';
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
  Cloud,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
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
    showToast,
  } = useJournal();

  const [activeTab, setActiveTab] = useState<'accounts' | 'strategies' | 'risk' | 'cloudinary' | 'data'>('accounts');

  // Cloudinary State
  const [cloudName, setCloudName] = useState<string>(settings.cloudinaryCloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '');
  const [apiKey, setApiKey] = useState<string>(settings.cloudinaryApiKey || '');
  const [apiSecret, setApiSecret] = useState<string>(settings.cloudinaryApiSecret || '');
  const [uploadPreset, setUploadPreset] = useState<string>(settings.cloudinaryUploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '');
  const [isTestingCloudinary, setIsTestingCloudinary] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);

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
  const [maxPositionRisk, setMaxPositionRisk] = useState<number>(settings.maxRiskPercent);
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
      maxRiskPercent: maxPositionRisk,
      maxDrawdownPercent: maxDrawdown,
      maxConsecutiveLosses,
    });
    showToast('Risk limits saved');
  };

  const handleSaveCloudinary = () => {
    updateSettings({
      cloudinaryCloudName: cloudName.trim(),
      cloudinaryApiKey: apiKey.trim(),
      cloudinaryApiSecret: apiSecret.trim(),
      cloudinaryUploadPreset: uploadPreset.trim(),
    });
    showToast('✓ Cloudinary settings saved');
  };

  const handleTestCloudinary = async () => {
    const cName = cloudName.trim();
    const aKey = apiKey.trim();
    const aSecret = apiSecret.trim();
    const preset = uploadPreset.trim();

    if (!cName) {
      setTestResult({
        success: false,
        message: 'Please enter your Cloudinary Cloud Name.',
      });
      return;
    }

    if (!aSecret && !preset) {
      setTestResult({
        success: false,
        message: 'Please enter either your Cloudinary API Secret (for backend uploads) or an Unsigned Upload Preset.',
      });
      return;
    }

    setIsTestingCloudinary(true);
    setTestResult(null);

    try {
      // 1x1 transparent PNG for lightweight verification
      const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const url = await uploadToCloudinary(testBase64, cName, preset, aKey, aSecret);
      setTestResult({
        success: true,
        message: 'Cloudinary upload verified successfully! Chart screenshots will now be uploaded to your Cloudinary cloud.',
        url,
      });
      showToast('✓ Cloudinary connected');
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to upload test image. Please check your credentials.',
      });
    } finally {
      setIsTestingCloudinary(false);
    }
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
            onClick={() => setActiveTab('cloudinary')}
            className={`py-2 px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'cloudinary'
                ? 'bg-emerald-600 text-white'
                : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Cloudinary Image Storage</span>
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
                        Currency: {acc.currency} • Starting: ${(acc.startingBalance ?? 0).toLocaleString()}
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

        {/* TAB 4: CLOUDINARY IMAGE STORAGE */}
        {activeTab === 'cloudinary' && (
          <div className="space-y-6">
            <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[#F5F5F5] text-base flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-emerald-400" />
                    <span>Cloudinary Direct Image Storage</span>
                  </h3>
                  <p className="text-xs text-[#A0A6AE] mt-1">
                    Store high-resolution chart screenshots on Cloudinary's fast global CDN. Free tier gives ~25GB of free storage with zero bandwidth limits.
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                  cloudName && uploadPreset
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cloudName && uploadPreset ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {cloudName && uploadPreset ? 'Configured' : 'Using Local Storage'}
                </span>
              </div>

              {/* Step-by-step Setup Guide */}
              <div className="bg-[#1B1F24] border border-[#292D33] rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Quick 1-Minute Setup Instructions
                </h4>
                <ol className="text-xs text-[#A0A6AE] space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Create a free account at{' '}
                    <a
                      href="https://cloudinary.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      cloudinary.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Copy your <strong>Cloud Name</strong> from the Cloudinary Dashboard (e.g. <code className="text-emerald-400 bg-black/40 px-1 py-0.5 rounded">my-trading-cloud</code>).</li>
                  <li>
                    In Cloudinary, go to <strong>Settings</strong> &rarr; <strong>Upload</strong> &rarr; scroll down to <strong>Upload presets</strong> &rarr; click <strong>Add upload preset</strong>.
                  </li>
                  <li>
                    Set <strong>Signing Mode</strong> to <span className="text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Unsigned</span> and save. Copy the <strong>Upload preset name</strong>.
                  </li>
                </ol>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A0A6AE]">
                    Cloudinary Cloud Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. my-trading-cloud"
                    value={cloudName}
                    onChange={(e) => setCloudName(e.target.value)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A0A6AE]">
                    API Key
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789012345"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A0A6AE]">
                    API Secret <span className="text-emerald-400 text-[10px]">(for secure server uploads)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Paste your Cloudinary API Secret here"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A0A6AE]">
                    Unsigned Upload Preset <span className="text-[10px] text-gray-500">(Optional if API Secret provided)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. trading_charts_preset"
                    value={uploadPreset}
                    onChange={(e) => setUploadPreset(e.target.value)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 border ${
                  testResult.success
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/30 border-red-500/30 text-red-300'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-medium">{testResult.message}</p>
                    {testResult.url && (
                      <p className="text-[11px] text-emerald-400/80 font-mono break-all">
                        Verified URL: {testResult.url}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveCloudinary}
                  className="py-2.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Cloudinary Credentials</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestCloudinary}
                  disabled={isTestingCloudinary || !cloudName.trim() || !uploadPreset.trim()}
                  className="py-2.5 px-4 rounded-lg bg-[#1B1F24] border border-[#292D33] hover:bg-[#292D33] disabled:opacity-50 text-[#F5F5F5] font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  {isTestingCloudinary ? (
                    <>
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span>Testing Upload…</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>Test Upload Connection</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DATA EXPORT & IMPORT */}
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
