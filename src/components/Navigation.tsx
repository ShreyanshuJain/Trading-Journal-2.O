import React from 'react';
import { useJournal, NavigationPage } from '../context/JournalContext';
import { useAuth } from '../context/AuthContext';
import { UserMenu } from './UserMenu';
import {
  LayoutDashboard,
  BookOpen,
  Calendar as CalendarIcon,
  Image as GalleryIcon,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  Wallet,
  Settings as SettingsIcon,
  Plus,
  Search,
  Layers,
  ChevronDown,
  LogOut,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    accounts,
    activeAccountId,
    setActiveAccountId,
    setIsAddTradeOpen,
    setIsSearchOpen,
    filteredTrades,
  } = useJournal();
  const { currentUser, logout } = useAuth();

  const navItems: { id: NavigationPage; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'gallery', label: 'Trade Gallery', icon: GalleryIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'strategies', label: 'Strategies & Tags', icon: Layers },
    { id: 'risk', label: 'Risk Management', icon: ShieldAlert },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* ── Desktop Left Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#15181D] border-r border-[#292D33] min-h-screen fixed left-0 top-0 bottom-0 z-30">
        {/* Logo */}
        <div className="p-5 border-b border-[#292D33] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-[#F5F5F5]">Trading Journal</h1>
            <p className="text-xs text-[#6F7680]">Professional Terminal</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="p-4 space-y-2 border-b border-[#292D33]">
          <button
            onClick={() => setIsAddTradeOpen(true)}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Trade</span>
          </button>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full py-2 px-3 rounded-lg bg-[#1B1F24] hover:bg-[#22272E] text-[#A0A6AE] border border-[#292D33] text-xs flex items-center justify-between transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search trades...</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#0D0F12] border border-[#292D33] text-[10px] text-[#6F7680]">⌘K</kbd>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1B1F24] text-white border-l-2 border-emerald-500'
                    : 'text-[#A0A6AE] hover:text-[#F5F5F5] hover:bg-[#1B1F24]/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-[#6F7680]'}`} />
                <span>{item.label}</span>
                {item.id === 'journal' && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#292D33] text-[#A0A6AE]">
                    {filteredTrades.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#292D33] bg-[#0D0F12]/50 space-y-3">
          {/* Account selector */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-semibold text-[#6F7680] block mb-1">
              Active Account
            </label>
            <div className="relative">
              <select
                value={activeAccountId}
                onChange={(e) => setActiveAccountId(e.target.value)}
                className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-2.5 py-2 pr-7 appearance-none cursor-pointer focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Accounts (Combined)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${(acc.currentBalance ?? 0).toLocaleString()})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#6F7680] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* User menu */}
          <UserMenu onSettingsClick={() => setCurrentPage('settings')} />
        </div>
      </aside>

      {/* ── Mobile Top Header ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#15181D] border-b border-[#292D33] px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-[#F5F5F5]">Trading Journal</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-lg bg-[#1B1F24] text-[#A0A6AE] border border-[#292D33]"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddTradeOpen(true)}
            className="py-1.5 px-3 rounded-lg bg-emerald-600 text-white font-medium text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Trade</span>
          </button>
          {/* Mobile user avatar */}
          {currentUser?.photoURL && (
            <img
              src={currentUser.photoURL}
              alt="User"
              className="w-7 h-7 rounded-full border border-[#292D33] cursor-pointer"
              onClick={logout}
              title="Sign out"
            />
          )}
        </div>
      </header>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#15181D] border-t border-[#292D33] px-2 flex items-center justify-around z-40">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
                isActive ? 'text-emerald-400 bg-[#1B1F24]' : 'text-[#6F7680]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-1 truncate max-w-[50px]">{item.label}</span>
            </button>
          );
        })}
        {/* Mobile logout */}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-lg text-[#6F7680]"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[10px] mt-1">Sign Out</span>
        </button>
      </nav>
    </>
  );
};
