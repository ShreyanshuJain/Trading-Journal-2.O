import React from 'react';
import { TrendingUp } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0D0F12] text-[#F5F5F5] flex">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#15181D] border-r border-[#292D33] fixed left-0 top-0 bottom-0">
        <div className="py-4 px-3 border-b border-[#292D33] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500/50 bg-[#0D0F12] shadow-xl flex items-center justify-center">
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
          <div className="mt-2.5">
            <div className="h-3 w-28 bg-[#1B1F24] rounded animate-pulse mx-auto mb-1" />
            <div className="h-2 w-20 bg-[#1B1F24] rounded animate-pulse mx-auto" />
          </div>
        </div>
        <div className="p-4 space-y-2 border-b border-[#292D33]">
          <div className="h-9 rounded-lg bg-[#1B1F24] animate-pulse" />
          <div className="h-8 rounded-lg bg-[#1B1F24] animate-pulse" />
        </div>
        <div className="px-3 py-4 space-y-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-[#1B1F24]/60 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </aside>

      {/* Mobile top bar skeleton */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#15181D] border-b border-[#292D33] flex items-center px-4 gap-3">
        <div className="w-7 h-7 rounded-md bg-emerald-600" />
        <div className="h-3.5 w-28 bg-[#292D33] rounded animate-pulse" />
      </div>

      {/* Main area skeleton */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
        {/* Header */}
        <div className="mb-6">
          <div className="h-7 w-64 bg-[#1B1F24] rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-[#1B1F24] rounded animate-pulse" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#15181D] border border-[#292D33] rounded-xl p-4" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="h-3 w-24 bg-[#292D33] rounded animate-pulse mb-3" />
              <div className="h-7 w-20 bg-[#1B1F24] rounded animate-pulse mb-2" />
              <div className="h-2.5 w-32 bg-[#1B1F24] rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-6">
          <div className="h-4 w-48 bg-[#292D33] rounded animate-pulse mb-4" />
          <div className="h-48 bg-[#1B1F24] rounded-lg animate-pulse" />
        </div>
      </main>

      {/* Loading text */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#15181D] border border-[#292D33] rounded-full px-4 py-2 shadow-xl">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
        <span className="text-xs text-[#A0A6AE]">Loading your journal…</span>
      </div>
    </div>
  );
};
