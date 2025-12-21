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
}

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
