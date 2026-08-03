import React from 'react';
import { JournalProvider, useJournal } from './context/JournalContext';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { JournalTable } from './components/JournalTable';
import { CalendarView } from './components/CalendarView';
import { TradeGalleryView } from './components/TradeGalleryView';
import { AnalyticsView } from './components/AnalyticsView';
import { StrategiesView } from './components/StrategiesView';
import { RiskView } from './components/RiskView';
import { AccountsView } from './components/AccountsView';
import { SettingsView } from './components/SettingsView';
import { TradeModal } from './components/TradeModal';
import { TradeDetailModal } from './components/TradeDetailModal';
import { CheckCircle2, Search, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    currentPage,
    isAddTradeOpen,
    setIsAddTradeOpen,
    editingTrade,
    setEditingTrade,
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    toastMessage,
  } = useJournal();

  return (
    <div className="min-h-screen bg-[#0D0F12] text-[#F5F5F5] font-sans flex flex-col lg:flex-row antialiased selection:bg-emerald-500/30">
      {/* Navigation Sidebar & Mobile Bottom Nav */}
      <Navigation />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto overflow-x-hidden lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8 pb-20 lg:pb-8">
        {currentPage === 'dashboard' && <DashboardView />}
        {currentPage === 'journal' && <JournalTable />}
        {currentPage === 'calendar' && <CalendarView />}
        {currentPage === 'gallery' && <TradeGalleryView />}
        {currentPage === 'analytics' && <AnalyticsView />}
        {currentPage === 'strategies' && <StrategiesView />}
        {currentPage === 'risk' && <RiskView />}
        {currentPage === 'accounts' && <AccountsView />}
        {currentPage === 'settings' && <SettingsView />}
      </main>

      {/* Global Quick Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
          <div className="bg-[#15181D] border border-[#292D33] w-full max-w-lg rounded-xl shadow-2xl p-4">
            <div className="flex items-center gap-3 border-b border-[#292D33] pb-3">
              <Search className="w-5 h-5 text-emerald-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search symbol, setup, notes, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-[#F5F5F5] placeholder-[#6F7680] focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-[#6F7680] hover:text-[#F5F5F5] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] text-[#A0A6AE] mt-3">
              Press Escape or click outside to dismiss. Search query applies live across all tables & views.
            </p>
          </div>
        </div>
      )}

      {/* Global Trade Creation / Editing Modal */}
      {(isAddTradeOpen || editingTrade) && (
        <TradeModal
          isOpen={isAddTradeOpen || !!editingTrade}
          onClose={() => {
            setIsAddTradeOpen(false);
            setEditingTrade(null);
          }}
          tradeToEdit={editingTrade}
        />
      )}

      {/* Global Trade Review Lightbox Modal */}
      <TradeDetailModal />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg font-medium text-xs flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <JournalProvider>
      <MainContent />
    </JournalProvider>
  );
}
