import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TeamMember, TeamRole } from '@/types/team';
import { useTier } from './useTier';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { limits, tier } = useTier();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team', user?.id],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        email: m.email,
        name: m.name || '',
        role: m.role as TeamRole,
        status: 'active' as const,
        invitedAt: m.created_at,
        joinedAt: m.created_at,
        avatarUrl: undefined,
      }));
    },
    enabled: !!user,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (vars: { name: string; email: string; password: string; role: TeamRole }) => {
      if (!user) throw new Error('Not authenticated');

      // Save current session before creating new user
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData.session;

      // Create Supabase auth account for the new member
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: vars.email,
        password: vars.password,
        options: {
          data: { full_name: vars.name },
        },
      });

      // Restore the original session immediately
      if (currentSession) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        });
      }

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');

      // Insert into team_members table
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          owner_id: user.id,
          member_user_id: authData.user.id,
          email: vars.email,
          name: vars.name,
          role: vars.role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Team member added successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add member');
    },
  });

  const addMember = async (data: { name: string; email: string; password: string; role: TeamRole }) => {
    if (members.length >= limits.maxTeamMembers) {
      return { success: false, error: 'Team member limit reached' };
    }
    if (members.some((m: TeamMember) => m.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Member already exists' };
    }
    try {
      await addMemberMutation.mutateAsync(data);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to add member' };
    }
  };

  const removeMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Member removed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove member');
    },
  });

  const removeMember = (id: string) => {
    removeMemberMutation.mutate(id);
  };

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: TeamRole }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Role updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update role');
    },
  });

  const updateMemberRole = (id: string, role: TeamRole) => {
    updateRoleMutation.mutate({ id, role });
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
    addMember,
    removeMember,
    updateMemberRole,
    getPendingInvites,
    getActiveMembers,
    canAddMember,
    remainingSeats,
    maxMembers: limits.maxTeamMembers,
    hasTeamFeatures: tier === 'agency',
  };
}
