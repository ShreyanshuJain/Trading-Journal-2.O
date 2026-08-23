import { Trade, Account, Strategy, Tag, UserSettings } from '../types';

export const initialAccounts: Account[] = [
  {
    id: 'acc_main',
    name: 'Main Trading Account',
    broker: 'Live / Prop Firm',
    startingBalance: 10000,
    currentBalance: 10000,
    currency: 'USD',
    type: 'Live',
  },
];

export const initialStrategies: Strategy[] = [
  {
    id: 'strat_1',
    name: 'Breakout Strategy',
    description: 'Trading key resistance or support breakouts with volume confirmation.',
    color: '#3B82F6',
  },
  {
    id: 'strat_2',
    name: 'Trend Following',
    description: 'Entering pullbacks in direction of higher timeframe trend.',
    color: '#10B981',
  },
  {
    id: 'strat_3',
    name: 'Liquidity Sweep',
    description: 'Session high/low sweep followed by market structure shift.',
    color: '#8B5CF6',
  },
];

export const initialTags: Tag[] = [
  { id: 'tag_1', name: 'A+ Setup', color: '#10B981' },
  { id: 'tag_2', name: 'News Event', color: '#F59E0B' },
  { id: 'tag_3', name: 'FOMO Entry', color: '#EC4899' },
  { id: 'tag_4', name: 'Disciplined Execution', color: '#8B5CF6' },
];

export const initialSettings: UserSettings = {
  defaultAccountId: 'acc_main',
  baseCurrency: 'USD',
  timezone: 'America/New_York',
  defaultRiskPercent: 1.0,
  maxRiskPercent: 2.0,
  maxDailyLossPercent: 5.0,
  maxDrawdownPercent: 10.0,
  maxConsecutiveLosses: 3,
  defaultLotSize: 1.0,
  defaultCommission: 0,
  enableNotifications: true,
  theme: 'dark',
  cloudinaryCloudName: 'bgowyyl2',
  cloudinaryApiKey: '124251242856859',
  cloudinaryApiSecret: '',
  cloudinaryUploadPreset: '',
};

export const initialTrades: Trade[] = [];
