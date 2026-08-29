import React, { useState } from 'react';
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
  MoreHorizontal,
  X,
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
  const [isMoreOpen, setIsMoreOpen] = useState(false);

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

  const primaryNavItems = navItems.slice(0, 3);
  const overflowNavItems = navItems.slice(3);
  const isMoreActive = overflowNavItems.some((item) => item.id === currentPage);

  return (
    <>
      {/* ── Desktop Left Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#15181D] border-r border-[#292D33] min-h-screen fixed left-0 top-0 bottom-0 z-30">
        {/* Logo in Circle */}
        <div className="py-4 px-3 border-b border-[#292D33] flex flex-col items-center justify-center text-center">
          <div
            className="relative group cursor-pointer"
            onClick={() => setCurrentPage('dashboard')}
            title="The Trading Journal Dashboard"
          >
            {/* Ambient glow */}
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-emerald-500/40 via-amber-500/30 to-blue-500/40 blur-md opacity-70 group-hover:opacity-100 transition duration-300" />

            {/* Circular Logo Frame */}
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500/50 group-hover:border-emerald-400 bg-[#0D0F12] shadow-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <img
                src="/logo_circular.png"
                alt="The Trading Journal"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover block"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
          </div>
          <div className="mt-2.5">
            <h2 className="text-xs font-bold tracking-wider text-[#F5F5F5] uppercase">
              The Trading Journal
            </h2>
            <p className="text-[10px] font-semibold tracking-widest text-emerald-400 mt-0.5 uppercase">
              Track • Analyze • Grow
            </p>
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
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#15181D] border-b border-[#292D33] px-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/50 bg-[#0D0F12] shadow-sm flex items-center justify-center flex-shrink-0">
            <img
              src="/logo_circular.png"
              alt="The Trading Journal"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover block"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>
          <span className="text-xs font-bold text-[#F5F5F5] tracking-wide">The Trading Journal</span>
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
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'text-emerald-400 bg-[#1B1F24]' : 'text-[#6F7680] hover:text-[#A0A6AE]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-1 truncate max-w-[50px]">{item.label}</span>
            </button>
          );
        })}

        {/* Mobile "More" Button */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors cursor-pointer ${
            isMoreActive ? 'text-emerald-400 bg-[#1B1F24]' : 'text-[#6F7680] hover:text-[#A0A6AE]'
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
          <span className="text-[10px] mt-1">More</span>
        </button>

        {/* Mobile logout */}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-lg text-[#6F7680] hover:text-red-400 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[10px] mt-1">Sign Out</span>
        </button>
      </nav>

      {/* ── Mobile More Bottom Sheet / Modal ── */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Bottom Sheet */}
          <div className="relative bg-[#15181D] border-t border-[#292D33] rounded-t-2xl p-5 shadow-2xl z-10 max-h-[80vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#292D33]">
              <h3 className="text-sm font-bold text-[#F5F5F5]">More Sections</h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-lg bg-[#1B1F24] text-[#A0A6AE] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {overflowNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setIsMoreOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-sm'
                        : 'bg-[#1B1F24] border-[#292D33] text-[#A0A6AE] hover:text-white hover:border-[#3E444D]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-emerald-400' : 'text-[#A0A6AE]'}`} />
                    <span className="text-xs font-medium line-clamp-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
