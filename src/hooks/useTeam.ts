import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TeamMember, TeamRole } from '@/types/team';
import { useTier } from './useTier';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function useTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { limits, tier } = useTier();
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch team');
      return res.json();
    },
    enabled: !!user,
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (vars: { email: string; role: TeamRole; name?: string }) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/team/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(vars),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to invite member');
      }
      return res.json();
    },
    onSuccess: (newMember) => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Member invited');
      return { success: true, member: newMember };
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to invite member');
    }
  });

  const inviteMember = (email: string, role: TeamRole, name?: string) => {
    if (members.length >= limits.maxTeamMembers) {
      return { success: false, error: 'Team member limit reached' };
    }
    if (members.some((m: TeamMember) => m.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Member already exists' };
    }
    inviteMemberMutation.mutate({ email, role, name });
    return { success: true, member: { email, role, name, status: 'pending' } as TeamMember };
  };

  const removeMember = (id: string) => {
    // TODO: Implement DELETE /api/team/:id
  };

  const updateMemberRole = (id: string, role: TeamRole) => {
    // TODO: Implement PUT /api/team/:id/role
  };

  const acceptInvite = (id: string) => {
    // TODO: Implement /api/team/accept-invite
  };

  const getPendingInvites = useCallback(() => {
    return members.filter((m: TeamMember) => m.status === 'pending');
  }, [members]);

  const getActiveMembers = useCallback(() => {
    return members.filter((m: TeamMember) => m.status === 'active');
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
