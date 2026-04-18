export interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  isPublic: boolean;
  createdAt: string;
  badges: string[];
  battleWins: number;
  battleLosses: number;
}

export interface BattleChallenge {
  id: string;
  challengerUsername: string;
  challengerStack: BattleStack;
  challengedUsername?: string;
  challengedStack?: BattleStack;
  createdAt: string;
  completedAt?: string;
  winnerId?: string;
}

export interface BattleStack {
  username: string;
  displayName: string;
  toolCount: number;
  totalInvestment: number;
  stackScore: number;
  healthScore: number;
  avgROI: number;
  topCategories: string[];
}

export interface BattleResult {
  winner: BattleStack;
  loser: BattleStack;
  metrics: {
    name: string;
    challengerValue: number;
    challengedValue: number;
    winner: 'challenger' | 'challenged' | 'tie';
  }[];
  overallWinner: 'challenger' | 'challenged' | 'tie';
}
