import { useState, useEffect, useCallback } from 'react';
import { TeamMember, TeamRole } from '@/types/team';
import { useTier } from './useTier';

const STORAGE_KEY = 'stackvault_team';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { limits, tier } = useTier();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMembers(JSON.parse(saved));
      } catch {
        setMembers([]);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    }
  }, [members, isLoading]);

  const inviteMember = useCallback((email: string, role: TeamRole, name?: string) => {
    if (members.length >= limits.maxTeamMembers) {
      return { success: false, error: 'Team member limit reached' };
    }

    if (members.some(m => m.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Member already exists' };
    }

    const newMember: TeamMember = {
      id: generateId(),
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      role,
      status: 'pending',
      invitedAt: new Date().toISOString(),
      joinedAt: null,
    };

    setMembers(prev => [...prev, newMember]);
    return { success: true, member: newMember };
  }, [members, limits.maxTeamMembers]);

  const removeMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMemberRole = useCallback((id: string, role: TeamRole) => {
    setMembers(prev => prev.map(m => 
      m.id === id ? { ...m, role } : m
    ));
  }, []);

  const acceptInvite = useCallback((id: string) => {
    setMembers(prev => prev.map(m => 
      m.id === id ? { ...m, status: 'active', joinedAt: new Date().toISOString() } : m
    ));
  }, []);

  const getPendingInvites = useCallback(() => {
    return members.filter(m => m.status === 'pending');
  }, [members]);

  const getActiveMembers = useCallback(() => {
    return members.filter(m => m.status === 'active');
  }, [members]);

  const canAddMember = members.length < limits.maxTeamMembers;
  const remainingSeats = Math.max(0, limits.maxTeamMembers - members.length);

  return {
    members,
    isLoading,
    inviteMember,
    removeMember,
    updateMemberRole,
    acceptInvite,
    getPendingInvites,
    getActiveMembers,
    canAddMember,
    remainingSeats,
    maxMembers: limits.maxTeamMembers,
    hasTeamFeatures: tier === 'agency',
  };
}
