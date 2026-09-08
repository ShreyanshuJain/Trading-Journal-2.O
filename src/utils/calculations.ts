import {
  Trade,
  Account,
  Strategy,
  DashboardStats,
  EquityCurvePoint,
  StrategyPerformance,
  PairPerformance,
  SessionPerformance,
  DayOfWeekPerformance,
  NewsPerformance,
  DateRangeFilter,
  TradingSession,
  UserSettings,
} from '../types';

/**
 * Calculates planned R:R (Risk to Reward ratio).
 */
export function calculatePlannedRR(entry: number, stopLoss: number, takeProfit: number): number {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  if (!risk || risk === 0) return 0;
  return Number((reward / risk).toFixed(2));
}

/**
 * Calculates realized R:R ratio based on exit price and direction.
 */
export function calculateRealizedRR(
  entry: number,
  stopLoss: number,
  exitPrice: number,
  direction: 'BUY' | 'SELL'
): number {
  const risk = Math.abs(entry - stopLoss);
  if (!risk || risk === 0) return 0;
  
  // Guard against microscopic fractional risk (e.g. entry=2500, stopLoss=2500.01) causing explosive R numbers
  if (entry > 0 && risk < entry * 0.0001) return 0;

  const move = direction === 'BUY' ? exitPrice - entry : entry - exitPrice;
  return Number((move / risk).toFixed(2));
}

/**
 * Filter trades by date range
 */
export function filterTradesByDateRange(
  trades: Trade[],
  filter: DateRangeFilter,
  customStart?: string,
  customEnd?: string
): Trade[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  return trades.filter((trade) => {
    if (!trade.date) return true;
    const tradeDate = new Date(trade.date);

    switch (filter) {
      case 'today':
        return trade.date === todayStr;

      case 'this_week': {
        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return tradeDate >= startOfWeek;
      }

      case 'this_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return tradeDate >= startOfMonth;
      }

      case 'last_month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        return tradeDate >= startOfLastMonth && tradeDate <= endOfLastMonth;
      }

      case '3m': {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return tradeDate >= threeMonthsAgo;
      }

      case '6m': {
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return tradeDate >= sixMonthsAgo;
      }

      case 'ytd': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return tradeDate >= startOfYear;
      }

      case 'custom': {
        if (customStart && customEnd) {
          return trade.date >= customStart && trade.date <= customEnd;
        }
        if (customStart) return trade.date >= customStart;
        if (customEnd) return trade.date <= customEnd;
        return true;
      }

      case 'all':
      default:
        return true;
    }
  });
}

/**
 * Compute primary Dashboard performance statistics
 */
export function calculateDashboardStats(trades: Trade[], account?: Account | null): DashboardStats {
  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return {
      totalPL: 0,
      netProfit: 0,
      grossProfit: 0,
      grossLoss: 0,
      winRate: 0,
      lossRate: 0,
      breakevenRate: 0,
      profitFactor: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      openTrades: 0,
      avgWin: 0,
      avgLoss: 0,
      avgRiskReward: 0,
      bestTrade: null,
      worstTrade: null,
      expectancy: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      winStreak: 0,
      lossStreak: 0,
    };
  }

  let totalPL = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let openTrades = 0;
  let totalRR = 0;

  let bestTrade: Trade | null = null;
  let worstTrade: Trade | null = null;

  trades.forEach((trade) => {
    const pl = typeof trade.netPL === 'number' ? trade.netPL : parseFloat(trade.netPL as any) || 0;
    const rMultiple = typeof trade.realizedRR === 'number' ? trade.realizedRR : parseFloat(trade.realizedRR as any) || 0;

    totalPL += pl;
    totalRR += rMultiple;

    if (trade.outcome === 'WIN') {
      winningTrades++;
      grossProfit += pl;
    } else if (trade.outcome === 'LOSS') {
      losingTrades++;
      grossLoss += Math.abs(pl);
    } else if (trade.outcome === 'BREAKEVEN') {
      breakevenTrades++;
    } else if (trade.outcome === 'OPEN') {
      openTrades++;
    } else if (trade.outcome === 'PARTIAL') {
      if (pl > 0) {
        winningTrades++;
        grossProfit += pl;
      } else {
        losingTrades++;
        grossLoss += Math.abs(pl);
      }
    }

    if (!bestTrade || pl > (Number(bestTrade.netPL) || 0)) {
      bestTrade = trade;
    }
    if (!worstTrade || pl < (Number(worstTrade.netPL) || 0)) {
      worstTrade = trade;
    }
  });

  const closedTrades = totalTrades - openTrades;
  const winRate = closedTrades > 0 ? Number(((winningTrades / closedTrades) * 100).toFixed(1)) : 0;
  const lossRate = closedTrades > 0 ? Number(((losingTrades / closedTrades) * 100).toFixed(1)) : 0;
  const breakevenRate = closedTrades > 0 ? Number(((breakevenTrades / closedTrades) * 100).toFixed(1)) : 0;

  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;
  const avgWin = winningTrades > 0 ? Number((grossProfit / winningTrades).toFixed(2)) : 0;
  const avgLoss = losingTrades > 0 ? Number((grossLoss / losingTrades).toFixed(2)) : 0;

  // Avg Risk : Reward (Payoff Ratio)
  // In trading metrics, Risk:Reward represents the ratio of reward (average win) to risk (average loss).
  // Formula: Avg Win / Avg Loss. When displayed as "1 : XR", X is always positive.
  let avgRiskReward = 0;
  if (avgLoss > 0 && avgWin > 0) {
    avgRiskReward = Number((avgWin / avgLoss).toFixed(2));
  } else if (winningTrades > 0) {
    const positiveRRs = trades
      .map((t) => (typeof t.realizedRR === 'number' ? t.realizedRR : parseFloat(t.realizedRR as any) || 0))
      .filter((r) => r > 0);
    if (positiveRRs.length > 0) {
      avgRiskReward = Number((positiveRRs.reduce((a, b) => a + b, 0) / positiveRRs.length).toFixed(2));
    } else {
      const plannedRRs = trades
        .map((t) => (typeof t.plannedRR === 'number' ? t.plannedRR : parseFloat(t.plannedRR as any) || 0))
        .filter((r) => r > 0);
      if (plannedRRs.length > 0) {
        avgRiskReward = Number((plannedRRs.reduce((a, b) => a + b, 0) / plannedRRs.length).toFixed(2));
      } else {
        avgRiskReward = 0;
      }
    }
  }
  avgRiskReward = Math.max(0, avgRiskReward);

  // Expectancy = (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
  const winProb = winRate / 100;
  const lossProb = lossRate / 100;
  const expectancy = Number(((winProb * avgWin) - (lossProb * avgLoss)).toFixed(2));

  // Calculate Streaks & Drawdown from chronological trades
  const sorted = [...trades].sort((a, b) => {
    const dtA = `${a.date} ${a.time || '00:00'}`;
    const dtB = `${b.date} ${b.time || '00:00'}`;
    return dtA.localeCompare(dtB);
  });

  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let currentLossStreak = 0;
  let maxLossStreak = 0;

  let peakEquity = account ? account.startingBalance : 0;
  let runningEquity = peakEquity;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;

  sorted.forEach((trade) => {
    if (trade.outcome === 'WIN') {
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else if (trade.outcome === 'LOSS') {
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    }

    runningEquity += trade.netPL;
    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    }
    const dd = peakEquity - runningEquity;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
      if (peakEquity > 0) {
        maxDrawdownPercent = (dd / peakEquity) * 100;
      }
    }
  });

  return {
    totalPL: Number(totalPL.toFixed(2)),
    netProfit: Number(totalPL.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    winRate,
    lossRate,
    breakevenRate,
    profitFactor,
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    openTrades,
    avgWin,
    avgLoss,
    avgRiskReward,
    bestTrade,
    worstTrade,
    expectancy,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(1)),
    winStreak: maxWinStreak,
    lossStreak: maxLossStreak,
  };
}

/**
 * Calculates time-ordered Equity Curve points for Recharts.
 */
export function calculateEquityCurve(trades: Trade[], startingBalance: number): EquityCurvePoint[] {
  if (trades.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        date: today,
        dailyPL: 0,
        cumulativePL: 0,
        equity: startingBalance,
        rMultiple: 0,
        drawdown: 0,
      },
    ];
  }

  // Sort trades by date & time ascending
  const sorted = [...trades].sort((a, b) => {
    const dtA = `${a.date} ${a.time || '00:00'}`;
    const dtB = `${b.date} ${b.time || '00:00'}`;
    return dtA.localeCompare(dtB);
  });

  const points: EquityCurvePoint[] = [];

  // Starting point
  const firstDate = sorted[0].date;
  points.push({
    date: firstDate,
    dailyPL: 0,
    cumulativePL: 0,
    equity: startingBalance,
    rMultiple: 0,
    drawdown: 0,
  });

  let runningEquity = startingBalance;
  let peakEquity = startingBalance;
  let cumulativePL = 0;
  let cumulativeR = 0;

  sorted.forEach((trade) => {
    const pl = typeof trade.netPL === 'number' ? trade.netPL : parseFloat(trade.netPL as any) || 0;
    const rMultiple = typeof trade.realizedRR === 'number' ? trade.realizedRR : parseFloat(trade.realizedRR as any) || 0;

    cumulativePL += pl;
    cumulativeR += rMultiple;
    runningEquity += pl;

    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    }
    const drawdown = Math.max(0, peakEquity - runningEquity);

    points.push({
      date: `${trade.date} ${trade.time || ''}`.trim(),
      tradeId: trade.id,
      symbol: trade.symbol,
      dailyPL: pl,
      cumulativePL: Number(cumulativePL.toFixed(2)),
      equity: Number(runningEquity.toFixed(2)),
      rMultiple: Number(cumulativeR.toFixed(2)),
      drawdown: Number(drawdown.toFixed(2)),
    });
  });

  return points;
}

/**
 * Calculates Strategy performance stats table
 */
export function calculateStrategyStats(trades: Trade[], strategies: Strategy[]): StrategyPerformance[] {
  const stratMap: Record<string, StrategyPerformance> = {};

  strategies.forEach((s) => {
    stratMap[s.id] = {
      strategyId: s.id,
      strategyName: s.name,
      color: s.color,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      winRate: 0,
      netPL: 0,
      avgRR: 0,
      profitFactor: 0,
      maxDrawdown: 0,
    };
  });

  // Track gross for profit factor
  const stratGross: Record<string, { profit: number; loss: number; totalRR: number }> = {};
  strategies.forEach((s) => {
    stratGross[s.id] = { profit: 0, loss: 0, totalRR: 0 };
  });

  trades.forEach((trade) => {
    const sid = trade.strategyId;
    const pl = typeof trade.netPL === 'number' ? trade.netPL : parseFloat(trade.netPL as any) || 0;
    const rMultiple = typeof trade.realizedRR === 'number' ? trade.realizedRR : parseFloat(trade.realizedRR as any) || 0;

    if (!stratMap[sid]) {
      stratMap[sid] = {
        strategyId: sid,
        strategyName: sid || 'Uncategorized',
        color: '#3B82F6',
        totalTrades: 0,
        wins: 0,
        losses: 0,
        breakevens: 0,
        winRate: 0,
        netPL: 0,
        avgRR: 0,
        profitFactor: 0,
        maxDrawdown: 0,
      };
      stratGross[sid] = { profit: 0, loss: 0, totalRR: 0 };
    }

    const st = stratMap[sid];
    const sg = stratGross[sid];

    st.totalTrades++;
    st.netPL += pl;
    sg.totalRR += rMultiple;

    if (trade.outcome === 'WIN') {
      st.wins++;
      sg.profit += pl;
    } else if (trade.outcome === 'LOSS') {
      st.losses++;
      sg.loss += Math.abs(pl);
    } else if (trade.outcome === 'BREAKEVEN') {
      st.breakevens++;
    }
  });

  return Object.values(stratMap).map((st) => {
    const sg = stratGross[st.strategyId] || { profit: 0, loss: 0, totalRR: 0 };
    const closed = st.wins + st.losses;
    st.winRate = closed > 0 ? Number(((st.wins / closed) * 100).toFixed(1)) : 0;
    st.netPL = Number(st.netPL.toFixed(2));
    const avgWin = st.wins > 0 ? sg.profit / st.wins : 0;
    const avgLoss = st.losses > 0 ? sg.loss / st.losses : 0;
    st.avgRR = avgLoss > 0 && avgWin > 0
      ? Number((avgWin / avgLoss).toFixed(2))
      : st.totalTrades > 0
        ? Math.max(0, Number((sg.totalRR / st.totalTrades).toFixed(2)))
        : 0;
    st.profitFactor = sg.loss > 0 ? Number((sg.profit / sg.loss).toFixed(2)) : sg.profit > 0 ? 99.9 : 0;
    return st;
  });
}

/**
 * Calculates Pair / Instrument performance
 */
export function calculatePairStats(trades: Trade[]): PairPerformance[] {
  const pairMap: Record<string, { trades: Trade[]; profit: number; loss: number; totalRR: number }> = {};

  trades.forEach((t) => {
    const sym = t.symbol.toUpperCase();
    const pl = typeof t.netPL === 'number' ? t.netPL : parseFloat(t.netPL as any) || 0;
    const rMultiple = typeof t.realizedRR === 'number' ? t.realizedRR : parseFloat(t.realizedRR as any) || 0;

    if (!pairMap[sym]) {
      pairMap[sym] = { trades: [], profit: 0, loss: 0, totalRR: 0 };
    }
    pairMap[sym].trades.push(t);
    if (pl > 0) pairMap[sym].profit += pl;
    else pairMap[sym].loss += Math.abs(pl);
    pairMap[sym].totalRR += rMultiple;
  });

  return Object.entries(pairMap).map(([symbol, data]) => {
    const totalTrades = data.trades.length;
    const wins = data.trades.filter((t) => t.outcome === 'WIN').length;
    const losses = data.trades.filter((t) => t.outcome === 'LOSS').length;
    const closed = wins + losses;
    const winRate = closed > 0 ? Number(((wins / closed) * 100).toFixed(1)) : 0;
    const netPL = Number(data.trades.reduce((acc, t) => acc + (Number(t.netPL) || 0), 0).toFixed(2));
    const avgWin = wins > 0 ? data.profit / wins : 0;
    const avgLoss = losses > 0 ? data.loss / losses : 0;
    const avgRR = avgLoss > 0 && avgWin > 0
      ? Number((avgWin / avgLoss).toFixed(2))
      : totalTrades > 0
        ? Math.max(0, Number((data.totalRR / totalTrades).toFixed(2)))
        : 0;
    const profitFactor = data.loss > 0 ? Number((data.profit / data.loss).toFixed(2)) : data.profit > 0 ? 99.9 : 0;

    return {
      symbol,
      totalTrades,
      wins,
      losses,
      winRate,
      netPL,
      avgRR,
      profitFactor,
    };
  }).sort((a, b) => b.netPL - a.netPL);
}

/**
 * Calculates Session performance
 */
export function calculateSessionStats(trades: Trade[]): SessionPerformance[] {
  const sessions: TradingSession[] = ['Asia', 'London', 'New York', 'London/NY Overlap', 'Custom'];
  
  return sessions.map((s) => {
    const sessionTrades = trades.filter((t) => t.session === s);
    const totalTrades = sessionTrades.length;
    const wins = sessionTrades.filter((t) => t.outcome === 'WIN').length;
    const losses = sessionTrades.filter((t) => t.outcome === 'LOSS').length;
    const closed = wins + losses;
    const winRate = closed > 0 ? Number(((wins / closed) * 100).toFixed(1)) : 0;
    const netPL = Number(sessionTrades.reduce((acc, t) => acc + (Number(t.netPL) || 0), 0).toFixed(2));
    const grossProfit = sessionTrades.filter((t) => (Number(t.netPL) || 0) > 0).reduce((acc, t) => acc + Number(t.netPL), 0);
    const grossLoss = sessionTrades.filter((t) => (Number(t.netPL) || 0) < 0).reduce((acc, t) => acc + Math.abs(Number(t.netPL)), 0);
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;
    const totalRR = sessionTrades.reduce((acc, t) => acc + (Number(t.realizedRR) || 0), 0);
    const avgRR = avgLoss > 0 && avgWin > 0
      ? Number((avgWin / avgLoss).toFixed(2))
      : totalTrades > 0
        ? Math.max(0, Number((totalRR / totalTrades).toFixed(2)))
        : 0;

    return {
      session: s,
      totalTrades,
      wins,
      losses,
      winRate,
      netPL,
      avgRR,
    };
  });
}

/**
 * Calculates Day-of-Week performance
 */
export function calculateDayOfWeekStats(trades: Trade[]): DayOfWeekPerformance[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayIndices = [1, 2, 3, 4, 5]; // Mon=1 ... Fri=5

  return days.map((dayName, idx) => {
    const targetDayIndex = dayIndices[idx];
    const dayTrades = trades.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d.getDay() === targetDayIndex;
    });

    const totalTrades = dayTrades.length;
    const wins = dayTrades.filter((t) => t.outcome === 'WIN').length;
    const losses = dayTrades.filter((t) => t.outcome === 'LOSS').length;
    const closed = wins + losses;
    const winRate = closed > 0 ? Number(((wins / closed) * 100).toFixed(1)) : 0;
    const netPL = Number(dayTrades.reduce((acc, t) => acc + (Number(t.netPL) || 0), 0).toFixed(2));

    return {
      day: dayName,
      totalTrades,
      wins,
      losses,
      winRate,
      netPL,
    };
  });
}

/**
 * Calculates News Event performance
 */
export function calculateNewsStats(trades: Trade[]): NewsPerformance[] {
  const newsMap: Record<string, Trade[]> = {};

  trades.forEach((t) => {
    if (t.news?.newsEvent) {
      const eventName = t.news.newsEvent;
      if (!newsMap[eventName]) newsMap[eventName] = [];
      newsMap[eventName].push(t);
    }
  });

  return Object.entries(newsMap).map(([newsEvent, eventTrades]) => {
    const totalTrades = eventTrades.length;
    const wins = eventTrades.filter((t) => t.outcome === 'WIN').length;
    const losses = eventTrades.filter((t) => t.outcome === 'LOSS').length;
    const closed = wins + losses;
    const winRate = closed > 0 ? Number(((wins / closed) * 100).toFixed(1)) : 0;
    const netPL = Number(eventTrades.reduce((acc, t) => acc + (Number(t.netPL) || 0), 0).toFixed(2));

    return {
      newsEvent,
      totalTrades,
      wins,
      losses,
      winRate,
      netPL,
    };
  }).sort((a, b) => b.totalTrades - a.totalTrades);
}
