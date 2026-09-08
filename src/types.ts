export type TradeOutcome = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'PARTIAL' | 'OPEN';

export type TradeDirection = 'BUY' | 'SELL';

export type TradingSession = 'Asia' | 'London' | 'New York' | 'London/NY Overlap' | 'Custom';

export type ImpactLevel = 'High' | 'Medium' | 'Low';

export type EmotionState =
  | 'Calm'
  | 'Confident'
  | 'Fearful'
  | 'FOMO'
  | 'Greedy'
  | 'Revenge Trading'
  | 'Uncertain'
  | 'Overconfident';

export type ScreenshotCategory =
  | 'Before Entry'
  | 'Entry'
  | 'During Trade'
  | 'Exit'
  | 'Post-Trade Analysis';

export interface TradeScreenshot {
  id: string;
  url: string;            // Firebase Storage download URL (or base64 during upload)
  storagePath?: string;   // Firebase Storage path for deletion
  caption?: string;
  category: ScreenshotCategory;
  createdAt: string;
}

export interface NewsData {
  newsEvent: string;
  currency: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  impact: ImpactLevel;
  marketBias?: string;
  marketReaction?: string;
  timingNote?: string;
}

export interface PsychologyData {
  whyEntered?: string;
  confirmation?: string;
  emotionBefore?: EmotionState;
  emotionAfter?: EmotionState;
  followedPlan?: boolean;
  validEntry?: boolean;
  tradeRating?: number;
  whatWentWell?: string;
  whatWentWrong?: string;
  lesson?: string;
  improvement?: string;
}

export interface Trade {
  id: string;
  userId: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  symbol: string;
  direction: TradeDirection;
  session: TradingSession;
  strategyId: string;
  setup: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number;
  lotSize: number;
  riskPercent: number;
  riskAmount: number;
  plannedRR: number;
  realizedRR: number;
  grossPL: number;
  commission: number;
  fees: number;
  netPL: number;
  outcome: TradeOutcome;
  notes: string;
  screenshots: TradeScreenshot[];
  news?: NewsData;
  psychology?: PsychologyData;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  broker: string;
  startingBalance: number;
  currentBalance: number; // Computed from trades; not persisted to Realtime Database
  currency: string;
  type: 'Personal' | 'Demo' | 'Funded' | 'Live' | 'Prop Firm' | 'Paper' | string;
  accountType?: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface UserSettings {
  defaultAccountId: string;
  baseCurrency: string;
  timezone: string;
  defaultRiskPercent: number;
  maxRiskPercent: number;
  maxDailyLossPercent: number;
  maxDrawdownPercent: number;
  maxConsecutiveLosses: number;
  defaultLotSize: number;
  defaultCommission: number;
  enableNotifications: boolean;
  theme: 'dark' | 'light';
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  cloudinaryUploadPreset?: string;
}

export type DateRangeFilter =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | '3m'
  | '6m'
  | 'ytd'
  | 'all'
  | 'custom';

export interface DashboardStats {
  totalPL: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  winRate: number;
  lossRate: number;
  breakevenRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  openTrades: number;
  avgWin: number;
  avgLoss: number;
  avgRiskReward: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  expectancy: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  winStreak: number;
  lossStreak: number;
}

export interface EquityCurvePoint {
  date: string;
  tradeId?: string;
  symbol?: string;
  dailyPL: number;
  cumulativePL: number;
  equity: number;
  rMultiple: number;
  drawdown: number;
}

export interface StrategyPerformance {
  strategyId: string;
  strategyName: string;
  color: string;
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  netPL: number;
  avgRR: number;
  profitFactor: number;
  maxDrawdown: number;
}

export interface PairPerformance {
  symbol: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPL: number;
  avgRR: number;
  profitFactor: number;
}

export interface SessionPerformance {
  session: TradingSession;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPL: number;
  avgRR: number;
}

export interface DayOfWeekPerformance {
  day: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPL: number;
}

export interface NewsPerformance {
  newsEvent: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPL: number;
}
