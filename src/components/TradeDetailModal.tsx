import React, { useState, useRef } from 'react';
import { useJournal } from '../context/JournalContext';
import { Trade, TradeScreenshot } from '../types';
import { optimizeImageFile, uploadScreenshotImage } from '../utils/imageUtils';
import { generateTradingChartSVG } from '../utils/chartSvgGenerator';
import {
  X,
  Edit2,
  Copy,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Image as ImageIcon,
  Maximize2,
  Calendar,
  Layers,
  Award,
  Upload,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const TradeDetailModal: React.FC = () => {
  const {
    selectedTradeDetail,
    setSelectedTradeDetail,
    setEditingTrade,
    duplicateTrade,
    deleteTrade,
    updateTrade,
    strategies,
    accounts,
    settings,
  } = useJournal();

  const [activeTab, setActiveTab] = useState<'overview' | 'screenshots' | 'review' | 'news'>('overview');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!selectedTradeDetail) return null;

  const trade = selectedTradeDetail;
  const strat = strategies.find((s) => s.id === trade.strategyId);
  const acc = accounts.find((a) => a.id === trade.accountId);

  const isWin = trade.outcome === 'WIN';
  const isLoss = trade.outcome === 'LOSS';
  const isBE = trade.outcome === 'BREAKEVEN';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newScreenshots: TradeScreenshot[] = [...(trade.screenshots || [])];
      const fileList = Array.from(files) as File[];
      for (const file of fileList) {
        if (!file.type.startsWith('image/')) continue;
        const optimizedUrl = await optimizeImageFile(file);
        let finalUrl = optimizedUrl;
        try {
          finalUrl = await uploadScreenshotImage(
            optimizedUrl,
            settings?.cloudinaryCloudName,
            settings?.cloudinaryUploadPreset,
            settings?.cloudinaryApiKey,
            settings?.cloudinaryApiSecret
          );
        } catch (uErr) {
          console.warn('Upload fallback to optimized base64:', uErr);
        }
        newScreenshots.push({
          id: `scr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          url: finalUrl,
          caption: `${trade.symbol} Chart Screenshot`,
          category: 'Entry',
          createdAt: new Date().toISOString(),
        });
      }

      const updated = { ...trade, screenshots: newScreenshots };
      await updateTrade(updated);
      setSelectedTradeDetail(updated);
    } catch (err) {
      console.error('Failed to attach screenshot:', err);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleGenerateAutoChart = async () => {
    setIsUploading(true);
    try {
      const chartUrl = generateTradingChartSVG({
        symbol: trade.symbol,
        direction: trade.direction,
        outcome: trade.outcome,
        entryPrice: trade.entry,
        stopLossPrice: trade.stopLoss,
        takeProfitPrice: trade.takeProfit,
      });

      const newScr: TradeScreenshot = {
        id: `scr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        url: chartUrl,
        caption: `${trade.symbol} Auto Generated Analysis Chart`,
        category: 'Entry',
        createdAt: new Date().toISOString(),
      };

      const updated = { ...trade, screenshots: [...(trade.screenshots || []), newScr] };
      await updateTrade(updated);
      setSelectedTradeDetail(updated);
    } catch (err) {
      console.error('Failed to generate auto chart:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteScreenshot = async (scrId: string) => {
    const updated = {
      ...trade,
      screenshots: (trade.screenshots || []).filter((s) => s.id !== scrId),
    };
    await updateTrade(updated);
    setSelectedTradeDetail(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#15181D] border border-[#292D33] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="p-5 border-b border-[#292D33] bg-[#1B1F24] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D0F12] border border-[#292D33] flex items-center justify-center font-bold text-base text-[#F5F5F5]">
              {trade.symbol}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#F5F5F5]">{trade.symbol}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    trade.direction === 'BUY'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                  }`}
                >
                  {trade.direction}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isWin
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isLoss
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  }`}
                >
                  {trade.outcome}
                </span>
              </div>
              <p className="text-xs text-[#A0A6AE] mt-0.5">
                {trade.date} at {trade.time} • {trade.session} Session • {acc?.name || 'Account'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right mr-3">
              <span className="text-[10px] uppercase text-[#6F7680] block font-semibold">Net P/L</span>
              <span
                className={`text-lg font-bold ${
                  trade.netPL >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {trade.netPL >= 0 ? '+' : ''}${trade.netPL.toLocaleString()}
              </span>
            </div>

            <button
              onClick={() => {
                setEditingTrade(trade);
                setSelectedTradeDetail(null);
              }}
              className="p-2 rounded-lg bg-[#292D33]/60 hover:bg-[#292D33] text-[#A0A6AE] hover:text-[#F5F5F5] cursor-pointer"
              title="Edit Trade"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                duplicateTrade(trade.id);
                setSelectedTradeDetail(null);
              }}
              className="p-2 rounded-lg bg-[#292D33]/60 hover:bg-[#292D33] text-[#A0A6AE] hover:text-[#F5F5F5] cursor-pointer"
              title="Duplicate Trade"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                deleteTrade(trade.id);
                setSelectedTradeDetail(null);
              }}
              className="p-2 rounded-lg bg-[#292D33]/60 hover:bg-red-600/30 text-[#A0A6AE] hover:text-red-400 cursor-pointer"
              title="Delete Trade"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedTradeDetail(null)}
              className="p-2 rounded-lg bg-[#292D33]/60 hover:bg-[#292D33] text-[#A0A6AE] hover:text-[#F5F5F5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-[#292D33] bg-[#0D0F12] px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#6F7680] hover:text-[#F5F5F5]'
            }`}
          >
            Overview & Execution
          </button>
          <button
            onClick={() => setActiveTab('screenshots')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'screenshots'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#6F7680] hover:text-[#F5F5F5]'
            }`}
          >
            <span>Chart Screenshots</span>
            {trade.screenshots?.length ? (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
                {trade.screenshots.length}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'review'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#6F7680] hover:text-[#F5F5F5]'
            }`}
          >
            Trade Review & Psychology
          </button>
          {trade.news?.newsEvent && (
            <button
              onClick={() => setActiveTab('news')}
              className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
                activeTab === 'news'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-[#6F7680] hover:text-[#F5F5F5]'
              }`}
            >
              News Catalyst
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-3 text-center">
                  <span className="text-[10px] text-[#6F7680] uppercase tracking-wider block font-semibold">
                    Realized R:R
                  </span>
                  <span className="text-base font-bold text-emerald-400">{trade.realizedRR} R</span>
                  <span className="text-[10px] text-[#6F7680] block mt-0.5">
                    Planned: {trade.plannedRR} R
                  </span>
                </div>

                <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-3 text-center">
                  <span className="text-[10px] text-[#6F7680] uppercase tracking-wider block font-semibold">
                    Risk Amount
                  </span>
                  <span className="text-base font-bold text-[#F5F5F5]">${trade.riskAmount}</span>
                  <span className="text-[10px] text-[#6F7680] block mt-0.5">
                    ({trade.riskPercent}% of account)
                  </span>
                </div>

                <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-3 text-center">
                  <span className="text-[10px] text-[#6F7680] uppercase tracking-wider block font-semibold">
                    Position Size
                  </span>
                  <span className="text-base font-bold text-[#F5F5F5]">{trade.lotSize} Lots</span>
                  <span className="text-[10px] text-[#6F7680] block mt-0.5">Standard Contract</span>
                </div>

                <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-3 text-center">
                  <span className="text-[10px] text-[#6F7680] uppercase tracking-wider block font-semibold">
                    Strategy
                  </span>
                  <span className="text-xs font-bold text-amber-400 block truncate">
                    {strat?.name || 'Custom'}
                  </span>
                </div>
              </div>

              {/* Price Levels Breakdown */}
              <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                  Execution Price Levels
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-[#15181D] p-2.5 rounded-lg border border-[#292D33]">
                    <span className="text-[10px] text-[#6F7680] uppercase block">Entry Price</span>
                    <span className="font-bold text-[#F5F5F5]">{trade.entry}</span>
                  </div>

                  <div className="bg-[#15181D] p-2.5 rounded-lg border border-red-500/30">
                    <span className="text-[10px] text-red-400 uppercase block">Stop Loss</span>
                    <span className="font-bold text-red-400">{trade.stopLoss}</span>
                  </div>

                  <div className="bg-[#15181D] p-2.5 rounded-lg border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 uppercase block">Take Profit</span>
                    <span className="font-bold text-emerald-400">{trade.takeProfit}</span>
                  </div>

                  <div className="bg-[#15181D] p-2.5 rounded-lg border border-[#292D33]">
                    <span className="text-[10px] text-[#6F7680] uppercase block">Exit Price</span>
                    <span className="font-bold text-[#F5F5F5]">{trade.exitPrice || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {trade.tags && trade.tags.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-[#A0A6AE] mb-1.5 block">Assigned Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {trade.tags.map((tg, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-[#1B1F24] border border-[#292D33] text-emerald-400 text-xs font-medium"
                      >
                        #{tg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Trade Notes */}
              {trade.notes && (
                <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-4">
                  <h3 className="text-xs font-bold text-[#F5F5F5] mb-1">Execution & Strategy Notes</h3>
                  <p className="text-xs text-[#A0A6AE] whitespace-pre-wrap leading-relaxed">
                    {trade.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'screenshots' && (
            <div className="space-y-4">
              {/* Action bar */}
              <div className="flex items-center justify-between bg-[#1B1F24] p-3 rounded-xl border border-[#292D33]">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-[#F5F5F5]">
                    Attached Screenshots ({trade.screenshots?.length || 0})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateAutoChart}
                    disabled={isUploading}
                    className="py-1.5 px-2.5 rounded-lg bg-[#292D33] hover:bg-[#323740] text-[#F5F5F5] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Auto Chart</span>
                  </button>

                  <label className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all">
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploading ? 'Processing...' : 'Upload Image'}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {!trade.screenshots || trade.screenshots.length === 0 ? (
                <div className="p-10 text-center text-[#6F7680] border-2 border-dashed border-[#292D33] rounded-xl space-y-3">
                  <ImageIcon className="w-8 h-8 mx-auto text-[#6F7680]" />
                  <div>
                    <p className="text-xs font-semibold text-[#A0A6AE]">No chart screenshots attached to this trade yet.</p>
                    <p className="text-[11px] text-[#6F7680] mt-1">Upload a trade chart screenshot or click Auto Chart above.</p>
                  </div>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={handleGenerateAutoChart}
                      className="px-3 py-1.5 rounded-lg bg-[#292D33] hover:bg-[#323740] text-emerald-400 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto Generate Chart</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trade.screenshots.map((scr) => (
                    <div
                      key={scr.id}
                      className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-3 space-y-2 group relative"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-[#0D0F12]">
                        <img
                          src={scr.url}
                          alt={scr.caption || 'Screenshot'}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setFullscreenImage(scr.url)}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all pointer-events-none">
                          <button
                            type="button"
                            onClick={() => setFullscreenImage(scr.url)}
                            className="p-2 rounded-lg bg-black/70 text-white hover:bg-black pointer-events-auto cursor-pointer"
                            title="Fullscreen View"
                          >
                            <Maximize2 className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteScreenshot(scr.id)}
                            className="p-2 rounded-lg bg-black/70 text-red-400 hover:bg-red-600 hover:text-white pointer-events-auto cursor-pointer"
                            title="Delete Screenshot"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-0.5 rounded bg-[#292D33] text-emerald-400 font-semibold text-[10px]">
                          {scr.category}
                        </span>
                        {scr.caption && <span className="text-[#A0A6AE] text-xs truncate max-w-[200px]">{scr.caption}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-[#6F7680] uppercase font-bold block">Why Entered?</span>
                  <p className="text-[#F5F5F5]">{trade.psychology?.whyEntered || 'N/A'}</p>
                </div>

                <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-[#6F7680] uppercase font-bold block">Confirmation Signal</span>
                  <p className="text-[#F5F5F5]">{trade.psychology?.confirmation || 'N/A'}</p>
                </div>

                <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-4 flex items-center justify-between">
                  <span className="font-semibold text-[#A0A6AE]">Followed Trading Plan?</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      trade.psychology?.followedPlan
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {trade.psychology?.followedPlan ? 'YES' : 'NO'}
                  </span>
                </div>

                <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-4 flex items-center justify-between">
                  <span className="font-semibold text-[#A0A6AE]">Was Entry Valid?</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      trade.psychology?.validEntry
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {trade.psychology?.validEntry ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-[#6F7680] uppercase font-bold block">Emotion Before Trade</span>
                  <span className="font-semibold text-amber-400">{trade.psychology?.emotionBefore || 'Calm'}</span>
                </div>

                <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-[#6F7680] uppercase font-bold block">Emotion After Exit</span>
                  <span className="font-semibold text-emerald-400">{trade.psychology?.emotionAfter || 'Confident'}</span>
                </div>
              </div>

              {trade.psychology?.lesson && (
                <div className="bg-[#1B1F24] border border-amber-500/30 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">Key Actionable Lesson</span>
                  <p className="text-[#F5F5F5] font-medium">{trade.psychology.lesson}</p>
                </div>
              )}

              <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-4 flex items-center justify-between">
                <span className="font-semibold text-[#A0A6AE]">Self Execution Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= (trade.psychology?.tradeRating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-[#292D33]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'news' && trade.news && (
            <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#292D33] pb-3">
                <h3 className="font-bold text-[#F5F5F5] text-sm">{trade.news.newsEvent}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    trade.news.impact === 'High'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {trade.news.impact} Impact
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#15181D] p-3 rounded-lg border border-[#292D33]">
                  <span className="text-[10px] text-[#6F7680] block">Actual</span>
                  <span className="font-bold text-[#F5F5F5] text-sm">{trade.news.actual || '-'}</span>
                </div>

                <div className="bg-[#15181D] p-3 rounded-lg border border-[#292D33]">
                  <span className="text-[10px] text-[#6F7680] block">Forecast</span>
                  <span className="font-bold text-[#A0A6AE] text-sm">{trade.news.forecast || '-'}</span>
                </div>

                <div className="bg-[#15181D] p-3 rounded-lg border border-[#292D33]">
                  <span className="text-[10px] text-[#6F7680] block">Market Reaction</span>
                  <span className="font-medium text-emerald-400">{trade.news.marketReaction || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50">
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-[#292D33] text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Full screen chart"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};
