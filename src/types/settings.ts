export type InterfaceMode = 'simple' | 'power';

export interface SocialSettings {
  enableBattles: boolean;
  enablePublicProfile: boolean;
  enableStealMyStack: boolean;
}

export const SIMPLE_MODE_NAV = ['dashboard', 'library', 'settings'] as const;
export const POWER_MODE_NAV = ['dashboard', 'library', 'analytics', 'insights', 'network', 'battles', 'extension', 'settings'] as const;

export const SIMPLE_MODE_FEATURES = {
  showWeeklySummary: false,
  showPortfolioAppraisal: false,
  showGoalsOverview: false,
  showStackHealthDoctor: false,
  showDailyUsagePrompt: false,
  showActiveTimers: false,
} as const;

export const POWER_MODE_FEATURES = {
  showWeeklySummary: true,
  showPortfolioAppraisal: true,
  showGoalsOverview: true,
  showStackHealthDoctor: true,
  showDailyUsagePrompt: true,
  showActiveTimers: true,
} as const;

export const DEFAULT_SOCIAL_SETTINGS: SocialSettings = {
  enableBattles: false,
  enablePublicProfile: false,
  enableStealMyStack: false,
};
