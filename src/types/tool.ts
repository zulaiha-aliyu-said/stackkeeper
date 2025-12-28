export interface UsageEntry {
  id: string;
  timestamp: string;
  duration?: number; // Session duration in seconds
  source: 'manual' | 'timer' | 'extension' | 'daily-prompt';
}

export type UsageGoalPeriod = 'weekly' | 'monthly';

export interface Tool {
  id: string;
  name: string;
  category: Category;
  platform: Platform;
  price: number;
  purchaseDate: string;
  login?: string;
  password?: string;
  redemptionCode?: string;
  notes?: string;
  addedDate: string;
  lastUsed: string | null;
  timesUsed: number;
  tags?: string[];
  toolUrl?: string;
  usageHistory?: UsageEntry[];
  currentStreak?: number;
  longestStreak?: number;
  usageGoal?: number;
  usageGoalPeriod?: UsageGoalPeriod;
  annualValue?: number; // What this tool would cost as annual subscription
}

export type SortOption = 'name' | 'price-asc' | 'price-desc' | 'date-newest' | 'date-oldest' | 'usage';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
  { value: 'price-asc', label: 'Price (Low to High)' },
  { value: 'date-newest', label: 'Newest First' },
  { value: 'date-oldest', label: 'Oldest First' },
  { value: 'usage', label: 'Most Used' },
];

export type Category = 
  | 'Marketing'
  | 'Design'
  | 'Productivity'
  | 'AI'
  | 'Dev Tools'
  | 'Analytics'
  | 'Email'
  | 'Video'
  | 'Other';

export type Platform = 
  | 'AppSumo'
  | 'PitchGround'
  | 'DealFuel'
  | 'StackSocial'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Marketing',
  'Design',
  'Productivity',
  'AI',
  'Dev Tools',
  'Analytics',
  'Email',
  'Video',
  'Other'
];

export const PLATFORMS: Platform[] = [
  'AppSumo',
  'PitchGround',
  'DealFuel',
  'StackSocial',
  'Other'
];
