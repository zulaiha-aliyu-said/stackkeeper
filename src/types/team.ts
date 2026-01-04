export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type MemberStatus = 'pending' | 'active';
export type UserTier = 'starter' | 'pro' | 'agency';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  status: MemberStatus;
  invitedAt: string;
  joinedAt: string | null;
  avatarUrl?: string;
}

export interface BrandingSettings {
  logo: string | null;
  appName: string;
  primaryColor: string;
  accentColor: string;
  showPoweredBy: boolean;
}

export interface Stack {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  isDefault: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  tier: UserTier;
  members: TeamMember[];
  stacks: Stack[];
  branding: BrandingSettings;
  createdAt: string;
}

export const ROLE_PERMISSIONS: Record<TeamRole, {
  canViewAllStacks: boolean;
  canAddEditTools: boolean;
  canDeleteTools: boolean;
  canManageTeam: boolean;
  canChangeBranding: boolean;
  canDeleteWorkspace: boolean;
}> = {
  owner: {
    canViewAllStacks: true,
    canAddEditTools: true,
    canDeleteTools: true,
    canManageTeam: true,
    canChangeBranding: true,
    canDeleteWorkspace: true,
  },
  admin: {
    canViewAllStacks: true,
    canAddEditTools: true,
    canDeleteTools: true,
    canManageTeam: true,
    canChangeBranding: false,
    canDeleteWorkspace: false,
  },
  editor: {
    canViewAllStacks: true,
    canAddEditTools: true,
    canDeleteTools: false,
    canManageTeam: false,
    canChangeBranding: false,
    canDeleteWorkspace: false,
  },
  viewer: {
    canViewAllStacks: true,
    canAddEditTools: false,
    canDeleteTools: false,
    canManageTeam: false,
    canChangeBranding: false,
    canDeleteWorkspace: false,
  },
};

export const TIER_LIMITS: Record<UserTier, {
  maxTools: number;
  maxStacks: number;
  maxTeamMembers: number;
  hasAdvancedAnalytics: boolean;
  hasTeamFeatures: boolean;
  hasBranding: boolean;
  hasPublicProfile: boolean;
  hasBattles: boolean;
  hasEmailImport: boolean;
}> = {
  starter: {
    maxTools: 25,
    maxStacks: 1,
    maxTeamMembers: 0,
    hasAdvancedAnalytics: false,
    hasTeamFeatures: false,
    hasBranding: false,
    hasPublicProfile: false,
    hasBattles: false,
    hasEmailImport: false,
  },
  pro: {
    maxTools: Infinity,
    maxStacks: 1,
    maxTeamMembers: 0,
    hasAdvancedAnalytics: true,
    hasTeamFeatures: false,
    hasBranding: false,
    hasPublicProfile: false,
    hasBattles: false,
    hasEmailImport: false,
  },
  agency: {
    maxTools: Infinity,
    maxStacks: 5,
    maxTeamMembers: 3,
    hasAdvancedAnalytics: true,
    hasTeamFeatures: true,
    hasBranding: true,
    hasPublicProfile: true,
    hasBattles: true,
    hasEmailImport: true,
  },
};
