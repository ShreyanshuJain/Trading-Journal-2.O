import React, { useState, useMemo } from 'react';
import { useJournal } from '../context/JournalContext';
import { HeaderBar } from './HeaderBar';
import { LayoutGrid, List, Filter, Eye, Plus, Image as ImageIcon } from 'lucide-react';

export const TradeGalleryView: React.FC = () => {
  const {
    filteredTrades,
    strategies,
    setSelectedTradeDetail,
    setIsAddTradeOpen,
  } = useJournal();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('all');

  const symbols = useMemo(() => {
    const s = new Set<string>();
    filteredTrades.forEach((t) => s.add(t.symbol));
    return Array.from(s).sort();
  }, [filteredTrades]);

  const galleryTrades = useMemo(() => {
    return filteredTrades.filter((t) => {
      if (strategyFilter !== 'all' && t.strategyId !== strategyFilter) return false;
      if (outcomeFilter !== 'all' && t.outcome !== outcomeFilter) return false;
      if (symbolFilter !== 'all' && t.symbol !== symbolFilter) return false;
      return true;
    });
  }, [filteredTrades, strategyFilter, outcomeFilter, symbolFilter]);

  return (
    <div className="pb-20 lg:pb-12">
      <HeaderBar
        title="Trade Gallery & Visual Playbook"
        subtitle="Browse setup screenshots, technical entries, and chart execution patterns."
      />

      <div className="px-4 md:px-6 space-y-6">
        {/* Gallery Filter Toolbar */}
        <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={strategyFilter}
              onChange={(e) => setStrategyFilter(e.target.value)}
              className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">All Strategies</option>
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">All Outcomes</option>
              <option value="WIN">WIN</option>
              <option value="LOSS">LOSS</option>
              <option value="BREAKEVEN">BREAKEVEN</option>
            </select>

            <select
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">All Pairs</option>
              {symbols.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#1B1F24] border border-[#292D33] p-1 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white'
                  : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white'
                  : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Gallery Cards Grid */}
        {galleryTrades.length === 0 ? (
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-16 text-center text-[#6F7680]">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 text-[#6F7680]" />
            <p className="text-base font-semibold text-[#A0A6AE]">No trade screenshots in gallery</p>
            <p className="text-xs mt-1">Adjust filters or record a trade with attached chart screenshots.</p>
            <button
              onClick={() => setIsAddTradeOpen(true)}
              className="mt-4 py-2 px-4 rounded-lg bg-emerald-600 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Trade with Screenshot</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {galleryTrades.map((trade) => {
              const strat = strategies.find((s) => s.id === trade.strategyId);
              const mainScreenshot =
                trade.screenshots && trade.screenshots.length > 0 ? trade.screenshots[0].url : null;

              const isWin = trade.outcome === 'WIN';
              const isLoss = trade.outcome === 'LOSS';

              return (
                <div
                  key={trade.id}
                  onClick={() => setSelectedTradeDetail(trade)}
                  className="bg-[#15181D] border border-[#292D33] hover:border-emerald-500/50 rounded-xl overflow-hidden shadow-lg transition-all cursor-pointer flex flex-col group"
                >
                  {/* Chart Screenshot Thumbnail */}
                  <div className="relative aspect-video bg-[#0D0F12] border-b border-[#292D33] overflow-hidden">
                    {mainScreenshot ? (
                      <img
                        src={mainScreenshot}
                        alt={trade.symbol}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#6F7680] text-xs">
                        No Screenshot Attached
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-black/70 text-white font-bold text-[10px]">
                        {trade.symbol}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trade.direction === 'BUY' ? 'bg-blue-600 text-white' : 'bg-pink-600 text-white'
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isWin
                            ? 'bg-emerald-600 text-white'
                            : isLoss
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        {trade.outcome}
                      </span>
                    </div>
                  </div>

                  {/* Card Info Content */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-emerald-400 font-bold text-sm">
                          {trade.netPL >= 0 ? '+' : ''}${trade.netPL.toLocaleString()}
                        </span>
                        <span className="font-semibold text-[#F5F5F5]">{trade.realizedRR} R</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#A0A6AE]">
                        <span>{strat?.name || 'Strategy'}</span>
                        <span>{trade.date}</span>
                      </div>

                      {trade.setup && (
                        <p className="text-[11px] text-[#6F7680] line-clamp-2 mt-2">
                          {trade.setup}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#292D33]/60 flex items-center justify-between text-[10px] text-[#6F7680]">
                      <span>{trade.session} Session</span>
                      <span className="text-emerald-400 font-medium group-hover:underline">View Playbook →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List Mode */
          <div className="space-y-3">
            {galleryTrades.map((trade) => {
              const strat = strategies.find((s) => s.id === trade.strategyId);
              const mainScreenshot =
                trade.screenshots && trade.screenshots.length > 0 ? trade.screenshots[0].url : null;

              return (
                <div
                  key={trade.id}
                  onClick={() => setSelectedTradeDetail(trade)}
                  className="bg-[#15181D] border border-[#292D33] hover:border-emerald-500/50 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-4 transition-all cursor-pointer group"
                >
                  <div className="w-full sm:w-40 aspect-video rounded-lg bg-[#0D0F12] overflow-hidden border border-[#292D33] shrink-0">
                    {mainScreenshot ? (
                      <img src={mainScreenshot} alt={trade.symbol} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6F7680]">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#F5F5F5]">{trade.symbol}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trade.direction === 'BUY' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                        }`}
                      >
                        {trade.direction}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trade.outcome === 'WIN'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {trade.outcome}
                      </span>
                    </div>

                    <p className="text-xs text-[#A0A6AE]">
                      {trade.date} • {strat?.name || 'Strategy'} • {trade.session} Session
                    </p>

                    {trade.notes && (
                      <p className="text-xs text-[#6F7680] line-clamp-1">{trade.notes}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-base font-bold ${
                        trade.netPL >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {trade.netPL >= 0 ? '+' : ''}${trade.netPL.toLocaleString()}
                    </div>
                    <span className="text-xs text-[#6F7680]">{trade.realizedRR} R</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
