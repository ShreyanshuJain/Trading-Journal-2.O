import React, { useState, useEffect } from 'react';
import { useJournal } from '../context/JournalContext';
import {
  Trade,
  TradeDirection,
  TradeOutcome,
  TradingSession,
  ScreenshotCategory,
  ImpactLevel,
  EmotionState,
  TradeScreenshot,
} from '../types';
import { calculatePlannedRR, calculateRealizedRR } from '../utils/calculations';
import { generateTradingChartSVG } from '../utils/chartSvgGenerator';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Check,
  Star,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeToEdit?: Trade | null;
}

export const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose, tradeToEdit }) => {
  const {
    accounts,
    strategies,
    tags,
    addTrade,
    updateTrade,
    addStrategy,
  } = useJournal();

  const [activeTab, setActiveTab] = useState<'execution' | 'risk' | 'screenshots' | 'news' | 'psychology' | 'tags'>(
    'execution'
  );

  // Form Fields
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('09:30');
  const [symbol, setSymbol] = useState<string>('XAUUSD');
  const [direction, setDirection] = useState<TradeDirection>('BUY');
  const [session, setSession] = useState<TradingSession>('New York');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [strategyId, setStrategyId] = useState<string>(strategies[0]?.id || '');
  const [setup, setSetup] = useState<string>('');

  // New Strategy Creation
  const [showNewStrategyInput, setShowNewStrategyInput] = useState<boolean>(false);
  const [newStrategyName, setNewStrategyName] = useState<string>('');

  // Prices & Risk (stored as strings to allow typing decimals like 0.1, 0.2, etc.)
  const [entryInput, setEntryInput] = useState<string>('');
  const [stopLossInput, setStopLossInput] = useState<string>('');
  const [takeProfitInput, setTakeProfitInput] = useState<string>('');
  const [exitPriceInput, setExitPriceInput] = useState<string>('');
  const [lotSizeInput, setLotSizeInput] = useState<string>('');
  const [commissionInput, setCommissionInput] = useState<string>('0');
  const [feesInput, setFeesInput] = useState<string>('0');
  const [riskPercentInput, setRiskPercentInput] = useState<string>('1.0');
  const [riskAmountInput, setRiskAmountInput] = useState<string>('');
  const [netPLInput, setNetPLInput] = useState<string>('0');
  const [outcome, setOutcome] = useState<TradeOutcome>('WIN');
  const [manualOverride, setManualOverride] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Derived numeric values for calculations
  const entry = parseFloat(entryInput) || 0;
  const stopLoss = parseFloat(stopLossInput) || 0;
  const takeProfit = parseFloat(takeProfitInput) || 0;
  const exitPrice = parseFloat(exitPriceInput) || 0;
  const lotSize = parseFloat(lotSizeInput) || 0;
  const commission = parseFloat(commissionInput) || 0;
  const fees = parseFloat(feesInput) || 0;
  const riskPercent = parseFloat(riskPercentInput) || 1.0;
  const riskAmount = parseFloat(riskAmountInput) || 0;
  const netPL = parseFloat(netPLInput) || 0;

  // Screenshots
  const [screenshots, setScreenshots] = useState<TradeScreenshot[]>([]);

  // News Fields
  const [newsEvent, setNewsEvent] = useState<string>('');
  const [newsCurrency, setNewsCurrency] = useState<string>('USD');
  const [newsActual, setNewsActual] = useState<string>('');
  const [newsForecast, setNewsForecast] = useState<string>('');
  const [newsImpact, setNewsImpact] = useState<ImpactLevel>('High');
  const [marketReaction, setMarketReaction] = useState<string>('');

  // Psychology Fields
  const [whyEntered, setWhyEntered] = useState<string>('');
  const [confirmation, setConfirmation] = useState<string>('');
  const [followedPlan, setFollowedPlan] = useState<boolean>(true);
  const [validEntry, setValidEntry] = useState<boolean>(true);
  const [emotionBefore, setEmotionBefore] = useState<EmotionState>('Calm');
  const [emotionAfter, setEmotionAfter] = useState<EmotionState>('Confident');
  const [whatWentWell, setWhatWentWell] = useState<string>('');
  const [whatWentWrong, setWhatWentWrong] = useState<string>('');
  const [lesson, setLesson] = useState<string>('');
  const [tradeRating, setTradeRating] = useState<number>(5);

  // Selected Tags
  const [selectedTags, setSelectedTags] = useState<string[]>(['A+ Setup']);

  // Populate form if editing
  useEffect(() => {
    if (tradeToEdit) {
      setDate(tradeToEdit.date);
      setTime(tradeToEdit.time || '09:30');
      setSymbol(tradeToEdit.symbol);
      setDirection(tradeToEdit.direction);
      setSession(tradeToEdit.session);
      setAccountId(tradeToEdit.accountId);
      setStrategyId(tradeToEdit.strategyId);
      setSetup(tradeToEdit.setup || '');
      setEntryInput(tradeToEdit.entry !== undefined ? tradeToEdit.entry.toString() : '');
      setStopLossInput(tradeToEdit.stopLoss !== undefined ? tradeToEdit.stopLoss.toString() : '');
      setTakeProfitInput(tradeToEdit.takeProfit !== undefined ? tradeToEdit.takeProfit.toString() : '');
      setExitPriceInput(tradeToEdit.exitPrice !== undefined ? tradeToEdit.exitPrice.toString() : '');
      setLotSizeInput(tradeToEdit.lotSize !== undefined ? tradeToEdit.lotSize.toString() : '');
      setCommissionInput((tradeToEdit.commission || 0).toString());
      setFeesInput((tradeToEdit.fees || 0).toString());
      setRiskPercentInput((tradeToEdit.riskPercent || 1.0).toString());
      setRiskAmountInput((tradeToEdit.riskAmount || 0).toString());
      setNetPLInput(tradeToEdit.netPL !== undefined ? tradeToEdit.netPL.toString() : '0');
      setOutcome(tradeToEdit.outcome);
      setNotes(tradeToEdit.notes || '');
      setScreenshots(tradeToEdit.screenshots || []);
      setSelectedTags(tradeToEdit.tags || []);

      if (tradeToEdit.news) {
        setNewsEvent(tradeToEdit.news.newsEvent || '');
        setNewsCurrency(tradeToEdit.news.currency || 'USD');
        setNewsActual(tradeToEdit.news.actual || '');
        setNewsForecast(tradeToEdit.news.forecast || '');
        setNewsImpact(tradeToEdit.news.impact || 'High');
        setMarketReaction(tradeToEdit.news.marketReaction || '');
      }

      if (tradeToEdit.psychology) {
        setWhyEntered(tradeToEdit.psychology.whyEntered || '');
        setConfirmation(tradeToEdit.psychology.confirmation || '');
        setFollowedPlan(tradeToEdit.psychology.followedPlan ?? true);
        setValidEntry(tradeToEdit.psychology.validEntry ?? true);
        setEmotionBefore(tradeToEdit.psychology.emotionBefore || 'Calm');
        setEmotionAfter(tradeToEdit.psychology.emotionAfter || 'Confident');
        setWhatWentWell(tradeToEdit.psychology.whatWentWell || '');
        setWhatWentWrong(tradeToEdit.psychology.whatWentWrong || '');
        setLesson(tradeToEdit.psychology.lesson || '');
        setTradeRating(tradeToEdit.psychology.tradeRating || 5);
      }
      setManualOverride(true);
    } else {
      // Default reset for new trade
      setDate(new Date().toISOString().split('T')[0]);
      setTime('09:30');
      setSymbol('XAUUSD');
      setDirection('BUY');
      setSession('New York');
      setAccountId(accounts[0]?.id || '');
      setStrategyId(strategies[0]?.id || '');
      setSetup('');
      setEntryInput('');
      setStopLossInput('');
      setTakeProfitInput('');
      setExitPriceInput('');
      setLotSizeInput('');
      setCommissionInput('0');
      setFeesInput('0');
      setRiskAmountInput('');
      setNetPLInput('0');
      setNotes('');
      setScreenshots([]);
      setSelectedTags(['A+ Setup']);
      setManualOverride(false);
    }
  }, [tradeToEdit, isOpen]);

  // Handle manual PnL input
  const handleNetPLChange = (valStr: string) => {
    setManualOverride(true);
    setNetPLInput(valStr);
    const num = parseFloat(valStr);
    if (isNaN(num)) {
      setOutcome('BREAKEVEN');
      return;
    }
    if (num > 0) setOutcome('WIN');
    else if (num < 0) setOutcome('LOSS');
    else setOutcome('BREAKEVEN');
  };

  const handlePLTypeToggle = (type: 'PROFIT' | 'LOSS') => {
    setManualOverride(true);
    const currentNum = parseFloat(netPLInput) || 0;
    const absVal = Math.abs(currentNum) || 100;
    if (type === 'PROFIT') {
      setNetPLInput(absVal.toString());
      setOutcome('WIN');
    } else {
      setNetPLInput((-absVal).toString());
      setOutcome('LOSS');
    }
  };

  // Ensure accountId and strategyId always match available options
  useEffect(() => {
    if (accounts.length > 0 && (!accountId || !accounts.some((a) => a.id === accountId))) {
      setAccountId(accounts[0].id);
    }
    if (strategies.length > 0 && (!strategyId || !strategies.some((s) => s.id === strategyId))) {
      setStrategyId(strategies[0].id);
    }
  }, [accounts, strategies, accountId, strategyId]);

  // Automatic calculation updates
  useEffect(() => {
    if (manualOverride) return;

    if (!entryInput || !exitPriceInput || !lotSizeInput || entry === 0 || exitPrice === 0 || lotSize === 0) {
      setNetPLInput('0');
      setOutcome('BREAKEVEN');
      return;
    }

    const plannedRRVal = calculatePlannedRR(entry, stopLoss, takeProfit);
    const realizedRRVal = calculateRealizedRR(entry, stopLoss, exitPrice, direction);

    // Auto calculate Net P/L
    let calcNet = 0;
    const move = direction === 'BUY' ? exitPrice - entry : entry - exitPrice;
    
    // Approximate pip values for standard forex/crypto/gold contracts
    const upperSym = symbol.toUpperCase();
    if (upperSym.includes('XAU')) {
      calcNet = move * lotSize * 100 - commission - fees;
    } else if (upperSym.includes('BTC') || upperSym.includes('ETH')) {
      calcNet = move * lotSize - commission - fees;
    } else {
      // Standard forex ~ $10 per pip per lot
      calcNet = move * lotSize * 100000 - commission - fees;
    }

    const netResult = Number(calcNet.toFixed(2));
    setNetPLInput(netResult.toString());

    // Auto outcome
    if (realizedRRVal >= 0.2) {
      setOutcome('WIN');
    } else if (realizedRRVal <= -0.8) {
      setOutcome('LOSS');
    } else if (Math.abs(realizedRRVal) < 0.2) {
      setOutcome('BREAKEVEN');
    }
  }, [entryInput, stopLossInput, takeProfitInput, exitPriceInput, entry, stopLoss, takeProfit, exitPrice, direction, lotSizeInput, lotSize, commissionInput, commission, feesInput, fees, symbol, manualOverride]);

  if (!isOpen) return null;

  const handleCreateStrategy = () => {
    if (!newStrategyName.trim()) return;
    const newStrat = {
      name: newStrategyName.trim(),
      description: 'Custom Strategy',
      color: '#3B82F6',
    };
    addStrategy(newStrat);
    setNewStrategyName('');
    setShowNewStrategyInput(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const newScr: TradeScreenshot = {
          id: `scr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          url,
          caption: `${symbol} Chart Screenshot`,
          category: 'Entry',
          createdAt: new Date().toISOString(),
        };
        setScreenshots((prev) => [...prev, newScr]);
      };
      reader.readAsDataURL(file);
    });
  };

  const generateAutoChartImage = () => {
    const chartUrl = generateTradingChartSVG({
      symbol,
      direction,
      outcome,
      entryPrice: entry,
      stopLossPrice: stopLoss,
      takeProfitPrice: takeProfit,
    });
    const newScr: TradeScreenshot = {
      id: `scr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      url: chartUrl,
      caption: `${symbol} Auto Generated Analysis Chart`,
      category: 'Entry',
      createdAt: new Date().toISOString(),
    };
    setScreenshots((prev) => [...prev, newScr]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const plannedRRVal = calculatePlannedRR(entry, stopLoss, takeProfit);
    const realizedRRVal = calculateRealizedRR(entry, stopLoss, exitPrice, direction);

    const tradeData = {
      userId: 'user_default',
      accountId: accountId || accounts[0]?.id || '',
      date,
      time,
      symbol: symbol.toUpperCase(),
      direction,
      session,
      strategyId,
      setup,
      entry: Number(entry),
      stopLoss: Number(stopLoss),
      takeProfit: Number(takeProfit),
      exitPrice: Number(exitPrice),
      lotSize: Number(lotSize),
      riskPercent: Number(riskPercent),
      riskAmount: Number(riskAmount),
      plannedRR: plannedRRVal,
      realizedRR: realizedRRVal,
      grossPL: Number((netPL + commission + fees).toFixed(2)),
      commission: Number(commission),
      fees: Number(fees),
      netPL: Number(netPL),
      outcome,
      notes,
      screenshots,
      tags: selectedTags,
      news: newsEvent
        ? {
            newsEvent,
            currency: newsCurrency,
            actual: newsActual,
            forecast: newsForecast,
            impact: newsImpact,
            marketReaction,
          }
        : undefined,
      psychology: {
        whyEntered,
        confirmation,
        followedPlan,
        validEntry,
        emotionBefore,
        emotionAfter,
        whatWentWell,
        whatWentWrong,
        lesson,
        tradeRating,
      },
    };

    if (tradeToEdit) {
      updateTrade(tradeToEdit.id, tradeData);
    } else {
      addTrade(tradeData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#15181D] border border-[#292D33] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#292D33] flex items-center justify-between bg-[#1B1F24]">
          <div>
            <h2 className="text-lg font-bold text-[#F5F5F5]">
              {tradeToEdit ? `Edit Trade: ${tradeToEdit.symbol}` : 'Record New Trade'}
            </h2>
            <p className="text-xs text-[#A0A6AE]">
              Fill trade parameters, price levels, screenshots, and review details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#292D33]/50 hover:bg-[#292D33] text-[#A0A6AE] hover:text-[#F5F5F5] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tab Navigation */}
        <div className="flex border-b border-[#292D33] bg-[#0D0F12] px-4 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('execution')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'execution'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#6F7680] hover:text-[#F5F5F5]'
            }`}
          >
            1. Core Execution
          </button>

          <button
            onClick={() => setActiveTab('risk')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'risk'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#6F7680] hover:text-[#F5F5F5]'
            }`}
          >
            2. Price & Risk (${netPL >= 0 ? '+' : ''}${netPL})
          </button>

          <button
            onClick={() => setActiveTab('screenshots')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'screenshots'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#6F7680] hover:text-[#F5F5F5]'
            }`}
          >
            <span>3. Chart Screenshots</span>
            {screenshots.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                {screenshots.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'news'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#6F7680] hover:text-[#F5F5F5]'
            }`}
          >
            4. News Trading
          </button>

          <button
            onClick={() => setActiveTab('psychology')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'psychology'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#6F7680] hover:text-[#F5F5F5]'
            }`}
          >
            5. Psychology & Review
          </button>

          <button
            onClick={() => setActiveTab('tags')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tags'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#6F7680] hover:text-[#F5F5F5]'
            }`}
          >
            6. Tags
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CORE EXECUTION */}
          {activeTab === 'execution' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Trade Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Trade Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">
                  Pair / Symbol (e.g., XAUUSD, EURUSD, BTCUSD)
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="XAUUSD"
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] font-bold rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection('BUY')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      direction === 'BUY'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1B1F24] text-[#A0A6AE] border border-[#292D33]'
                    }`}
                  >
                    BUY / LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('SELL')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      direction === 'SELL'
                        ? 'bg-pink-600 text-white'
                        : 'bg-[#1B1F24] text-[#A0A6AE] border border-[#292D33]'
                    }`}
                  >
                    SELL / SHORT
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Trading Session</label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value as TradingSession)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Asia">Asia Session</option>
                  <option value="London">London Session</option>
                  <option value="New York">New York Session</option>
                  <option value="London/NY Overlap">London/NY Overlap</option>
                  <option value="Custom">Custom / Off-hours</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Trading Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {accounts.length === 0 && <option value="">No Accounts Available</option>}
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (${acc.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#A0A6AE]">Strategy</label>
                  <button
                    type="button"
                    onClick={() => setShowNewStrategyInput(!showNewStrategyInput)}
                    className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    + Create Custom Strategy
                  </button>
                </div>

                {showNewStrategyInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Strategy Name..."
                      value={newStrategyName}
                      onChange={(e) => setNewStrategyName(e.target.value)}
                      className="flex-1 bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateStrategy}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 text-white text-xs font-medium cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <select
                    value={strategyId}
                    onChange={(e) => setStrategyId(e.target.value)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {strategies.length === 0 && <option value="">No Strategies Available</option>}
                    {strategies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">
                  Setup Name / Pattern
                </label>
                <input
                  type="text"
                  placeholder="e.g., 5m FVG Retest after Asian High Sweep"
                  value={setup}
                  onChange={(e) => setSetup(e.target.value)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Net P/L ($) & Outcome Block */}
              <div className="md:col-span-2 bg-[#1B1F24] border border-[#292D33] rounded-xl p-4 space-y-3 mt-2">
                <div className="flex items-center justify-between border-b border-[#292D33] pb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-[#F5F5F5]">Net Profit / Loss ($) & Trade Outcome</span>
                  </div>
                  {manualOverride && (
                    <button
                      type="button"
                      onClick={() => setManualOverride(false)}
                      className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                    >
                      Reset to Price Auto-calculation
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  {/* Profit / Loss Toggle */}
                  <div>
                    <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">P/L Type</label>
                    <div className="grid grid-cols-2 gap-1.5 bg-[#15181D] p-1 rounded-lg border border-[#292D33]">
                      <button
                        type="button"
                        onClick={() => handlePLTypeToggle('PROFIT')}
                        className={`py-1.5 px-2 rounded text-xs font-bold transition-all cursor-pointer ${
                          netPL >= 0
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-[#A0A6AE] hover:text-white'
                        }`}
                      >
                        + Profit
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePLTypeToggle('LOSS')}
                        className={`py-1.5 px-2 rounded text-xs font-bold transition-all cursor-pointer ${
                          netPL < 0
                            ? 'bg-red-600 text-white shadow'
                            : 'text-[#A0A6AE] hover:text-white'
                        }`}
                      >
                        - Loss
                      </button>
                    </div>
                  </div>

                  {/* Net P/L Dollar Input */}
                  <div>
                    <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">
                      Net P/L ($) {manualOverride ? '(Manual Override)' : '(Auto)'}
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold ${
                          netPL >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        $
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={netPLInput}
                        onChange={(e) => handleNetPLChange(e.target.value)}
                        placeholder="0.00"
                        className={`w-full bg-[#15181D] border rounded-lg pl-7 pr-3 py-2 text-xs font-bold font-mono focus:outline-none cursor-text ${
                          netPL >= 0
                            ? 'border-emerald-500/40 text-emerald-400 focus:border-emerald-500'
                            : 'border-red-500/40 text-red-400 focus:border-red-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Trade Outcome */}
                  <div>
                    <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Trade Outcome</label>
                    <div className="grid grid-cols-3 gap-1 bg-[#15181D] p-1 rounded-lg border border-[#292D33]">
                      <button
                        type="button"
                        onClick={() => {
                          setOutcome('WIN');
                          setManualOverride(true);
                          if (netPL <= 0) setNetPLInput((Math.abs(netPL) || 100).toString());
                        }}
                        className={`py-1.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                          outcome === 'WIN'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'text-[#6F7680] hover:text-[#F5F5F5]'
                        }`}
                      >
                        WIN
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOutcome('LOSS');
                          setManualOverride(true);
                          if (netPL >= 0) setNetPLInput((-Math.abs(netPL) || -100).toString());
                        }}
                        className={`py-1.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                          outcome === 'LOSS'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'text-[#6F7680] hover:text-[#F5F5F5]'
                        }`}
                      >
                        LOSS
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOutcome('BREAKEVEN');
                          setManualOverride(true);
                          setNetPLInput('0');
                        }}
                        className={`py-1.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                          outcome === 'BREAKEVEN'
                            ? 'bg-gray-500/20 text-gray-300 border border-gray-500/40'
                            : 'text-[#6F7680] hover:text-[#F5F5F5]'
                        }`}
                      >
                        BE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICE & RISK CALCULATIONS */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    value={entryInput}
                    onChange={(e) => setEntryInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] font-mono rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-red-400 mb-1 block">Stop Loss</label>
                  <input
                    type="number"
                    step="any"
                    value={stopLossInput}
                    onChange={(e) => setStopLossInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#1B1F24] border border-red-500/30 text-[#F5F5F5] font-mono rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-emerald-400 mb-1 block">Take Profit</label>
                  <input
                    type="number"
                    step="any"
                    value={takeProfitInput}
                    onChange={(e) => setTakeProfitInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#1B1F24] border border-emerald-500/30 text-[#F5F5F5] font-mono rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Exit Price</label>
                  <input
                    type="number"
                    step="any"
                    value={exitPriceInput}
                    onChange={(e) => setExitPriceInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] font-mono rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Position Size (Lots)</label>
                  <input
                    type="number"
                    step="any"
                    value={lotSizeInput}
                    onChange={(e) => setLotSizeInput(e.target.value)}
                    placeholder="1.0"
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Risk Amount ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={riskAmountInput}
                    onChange={(e) => setRiskAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Commission ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={commissionInput}
                    onChange={(e) => setCommissionInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Swap / Fees ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={feesInput}
                    onChange={(e) => setFeesInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Auto Calculated Summary Card */}
              <div className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#292D33] pb-2">
                  <span className="text-xs font-bold text-[#F5F5F5]">Automatic Risk & Return Calculations</span>
                  <button
                    type="button"
                    onClick={() => setManualOverride(!manualOverride)}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    {manualOverride ? 'Disable Manual Override' : 'Manual Override'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-[#15181D] p-2.5 rounded-lg border border-[#292D33]">
                    <span className="text-[10px] text-[#6F7680] uppercase tracking-wider block">Planned R:R</span>
                    <span className="text-sm font-bold text-[#F5F5F5]">
                      1 : {calculatePlannedRR(entry, stopLoss, takeProfit)}R
                    </span>
                  </div>

                  <div className="bg-[#15181D] p-2.5 rounded-lg border border-[#292D33]">
                    <span className="text-[10px] text-[#6F7680] uppercase tracking-wider block">Realized R:R</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {calculateRealizedRR(entry, stopLoss, exitPrice, direction)}R
                    </span>
                  </div>

                  <div className="bg-[#15181D] p-2.5 rounded-lg border border-[#292D33]">
                    <span className="text-[10px] text-[#6F7680] uppercase tracking-wider block">Net P/L ($)</span>
                    {manualOverride ? (
                      <input
                        type="number"
                        step="any"
                        value={netPLInput}
                        onChange={(e) => handleNetPLChange(e.target.value)}
                        className="w-full bg-transparent text-center font-bold text-emerald-400 focus:outline-none"
                      />
                    ) : (
                      <span className={`text-sm font-bold ${netPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {netPL >= 0 ? '+' : ''}${netPL.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="bg-[#15181D] p-2.5 rounded-lg border border-[#292D33]">
                    <span className="text-[10px] text-[#6F7680] uppercase tracking-wider block">Trade Outcome</span>
                    <select
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value as TradeOutcome)}
                      className="bg-transparent text-xs font-bold text-[#F5F5F5] focus:outline-none cursor-pointer"
                    >
                      <option value="WIN" className="bg-[#15181D] text-emerald-400">
                        WIN
                      </option>
                      <option value="LOSS" className="bg-[#15181D] text-red-400">
                        LOSS
                      </option>
                      <option value="BREAKEVEN" className="bg-[#15181D] text-gray-300">
                        BREAKEVEN
                      </option>
                      <option value="PARTIAL" className="bg-[#15181D] text-amber-400">
                        PARTIAL
                      </option>
                      <option value="OPEN" className="bg-[#15181D] text-blue-400">
                        OPEN
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Trade Notes / Strategy Execution Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record key market context, liquidity sweeps, news catalysts, or execution details..."
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg p-3 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: CHART SCREENSHOTS */}
          {activeTab === 'screenshots' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1B1F24] p-4 rounded-xl border border-[#292D33]">
                <div>
                  <h3 className="text-xs font-bold text-[#F5F5F5]">Attach Chart Screenshots</h3>
                  <p className="text-[11px] text-[#A0A6AE]">
                    Upload PNG, JPG, WEBP chart images or generate an automated trading chart visualization.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={generateAutoChartImage}
                    className="py-2 px-3 rounded-lg bg-[#292D33] hover:bg-[#323740] text-[#F5F5F5] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Auto Generate Chart</span>
                  </button>

                  <label className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Screenshots Preview Grid */}
              {screenshots.length === 0 ? (
                <div className="border-2 border-dashed border-[#292D33] rounded-xl p-8 text-center text-[#6F7680]">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-[#6F7680]" />
                  <p className="text-xs font-medium text-[#A0A6AE]">No chart screenshots attached yet</p>
                  <p className="text-[11px] mt-1">
                    Drag and drop chart images or click "Auto Generate Chart" above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {screenshots.map((scr, idx) => (
                    <div key={scr.id} className="bg-[#1B1F24] border border-[#292D33] rounded-xl overflow-hidden p-3 space-y-2">
                      <div className="relative aspect-video bg-[#0D0F12] rounded-lg overflow-hidden border border-[#292D33]">
                        <img src={scr.url} alt={scr.caption} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setScreenshots((prev) => prev.filter((s) => s.id !== scr.id))}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#6F7680] block mb-0.5 font-semibold">Category</label>
                          <select
                            value={scr.category}
                            onChange={(e) => {
                              const cat = e.target.value as ScreenshotCategory;
                              setScreenshots((prev) =>
                                prev.map((s) => (s.id === scr.id ? { ...s, category: cat } : s))
                              );
                            }}
                            className="w-full bg-[#15181D] border border-[#292D33] text-[#F5F5F5] text-[11px] rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                          >
                            <option value="Before Entry">Before Entry</option>
                            <option value="Entry">Entry</option>
                            <option value="During Trade">During Trade</option>
                            <option value="Exit">Exit</option>
                            <option value="Post-Trade Analysis">Post-Trade Analysis</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#6F7680] block mb-0.5 font-semibold">Caption</label>
                          <input
                            type="text"
                            value={scr.caption || ''}
                            onChange={(e) => {
                              const cap = e.target.value;
                              setScreenshots((prev) =>
                                prev.map((s) => (s.id === scr.id ? { ...s, caption: cap } : s))
                              );
                            }}
                            placeholder="Add screenshot note..."
                            className="w-full bg-[#15181D] border border-[#292D33] text-[#F5F5F5] text-[11px] rounded-lg px-2 py-1 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NEWS TRADING */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">News Event Catalyst</label>
                  <select
                    value={newsEvent}
                    onChange={(e) => setNewsEvent(e.target.value)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="">None / Technical Trade</option>
                    <option value="CPI Inflation Rate (YoY)">CPI Inflation Rate</option>
                    <option value="Non-Farm Payrolls (NFP)">Non-Farm Payrolls (NFP)</option>
                    <option value="FOMC Rate Decision & Statement">FOMC Rate Decision</option>
                    <option value="Core PPI Final Demand">PPI Producer Price Index</option>
                    <option value="Federal Funds Rate">Fed Funds Rate</option>
                    <option value="Unemployment Rate">Unemployment Rate</option>
                    <option value="Gross Domestic Product (GDP)">GDP Release</option>
                    <option value="Retail Sales">Retail Sales</option>
                    <option value="Jobless Claims">Initial Jobless Claims</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Impact Level</label>
                  <select
                    value={newsImpact}
                    onChange={(e) => setNewsImpact(e.target.value as ImpactLevel)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="High">High Impact (Red Folder)</option>
                    <option value="Medium">Medium Impact (Orange Folder)</option>
                    <option value="Low">Low Impact (Yellow Folder)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Actual Release Figure</label>
                  <input
                    type="text"
                    placeholder="e.g., 2.9% or +315K"
                    value={newsActual}
                    onChange={(e) => setNewsActual(e.target.value)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Forecast Figure</label>
                  <input
                    type="text"
                    placeholder="e.g., 3.1% or +180K"
                    value={newsForecast}
                    onChange={(e) => setNewsForecast(e.target.value)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Market Reaction & Slippage Notes</label>
                <textarea
                  rows={3}
                  value={marketReaction}
                  onChange={(e) => setMarketReaction(e.target.value)}
                  placeholder="Describe initial spike direction, slippage encountered, or post-release FVG creation..."
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg p-3 text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 5: PSYCHOLOGY & REVIEW */}
          {activeTab === 'psychology' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Why did I enter this trade?</label>
                  <input
                    type="text"
                    placeholder="Primary setup reason..."
                    value={whyEntered}
                    onChange={(e) => setWhyEntered(e.target.value)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">What was the confirmation signal?</label>
                  <input
                    type="text"
                    placeholder="5m displacement, FVG, MSS..."
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Emotion Before Entry</label>
                  <select
                    value={emotionBefore}
                    onChange={(e) => setEmotionBefore(e.target.value as EmotionState)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Calm">Calm</option>
                    <option value="Confident">Confident</option>
                    <option value="Fearful">Fearful</option>
                    <option value="FOMO">FOMO</option>
                    <option value="Greedy">Greedy</option>
                    <option value="Revenge Trading">Revenge Trading</option>
                    <option value="Uncertain">Uncertain</option>
                    <option value="Overconfident">Overconfident</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Emotion After Exit</label>
                  <select
                    value={emotionAfter}
                    onChange={(e) => setEmotionAfter(e.target.value as EmotionState)}
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Calm">Calm</option>
                    <option value="Confident">Confident</option>
                    <option value="Fearful">Fearful</option>
                    <option value="FOMO">FOMO</option>
                    <option value="Greedy">Greedy</option>
                    <option value="Revenge Trading">Revenge Trading</option>
                    <option value="Uncertain">Uncertain</option>
                    <option value="Overconfident">Overconfident</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-xs font-semibold text-[#A0A6AE]">Did I follow my plan?</label>
                  <button
                    type="button"
                    onClick={() => setFollowedPlan(!followedPlan)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      followedPlan ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}
                  >
                    {followedPlan ? 'YES' : 'NO'}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-xs font-semibold text-[#A0A6AE]">Was the entry valid?</label>
                  <button
                    type="button"
                    onClick={() => setValidEntry(!validEntry)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      validEntry ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}
                  >
                    {validEntry ? 'YES' : 'NO'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-emerald-400 mb-1 block">What went well?</label>
                  <textarea
                    rows={2}
                    value={whatWentWell}
                    onChange={(e) => setWhatWentWell(e.target.value)}
                    placeholder="Patience, execution speed, position sizing..."
                    className="w-full bg-[#1B1F24] border border-emerald-500/30 text-[#F5F5F5] rounded-lg p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-red-400 mb-1 block">What went wrong?</label>
                  <textarea
                    rows={2}
                    value={whatWentWrong}
                    onChange={(e) => setWhatWentWrong(e.target.value)}
                    placeholder="Chased price, moved SL early, over-leveraged..."
                    className="w-full bg-[#1B1F24] border border-red-500/30 text-[#F5F5F5] rounded-lg p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Key Lesson Learned</label>
                <input
                  type="text"
                  value={lesson}
                  onChange={(e) => setLesson(e.target.value)}
                  placeholder="Actionable takeaway for future trades..."
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-[#F5F5F5] rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A0A6AE] mb-1 block">Overall Execution Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTradeRating(star)}
                      className="p-1 text-amber-400 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${star <= tradeRating ? 'fill-amber-400' : 'text-[#292D33]'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TAGS */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              <label className="text-xs font-semibold text-[#A0A6AE] mb-2 block">Assign Setup Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tg) => {
                  const isSelected = selectedTags.includes(tg.name);
                  return (
                    <button
                      key={tg.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTags((prev) => prev.filter((t) => t !== tg.name));
                        } else {
                          setSelectedTags((prev) => [...prev, tg.name]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-[#1B1F24] text-[#A0A6AE] border-[#292D33] hover:text-[#F5F5F5]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{tg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-[#292D33] flex items-center justify-between">
            <span className="text-xs text-[#6F7680]">
              Calculated P/L: <strong className={netPL >= 0 ? 'text-emerald-400' : 'text-red-400'}>${netPL}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-lg bg-[#1B1F24] border border-[#292D33] text-[#A0A6AE] text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="py-2 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                {tradeToEdit ? 'Save Changes' : 'Record Trade'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
