import { useState } from 'react';
import { useTeam } from '@/hooks/useTeam';
import { useTier } from '@/hooks/useTier';
import { TeamMemberCard } from '@/components/TeamMemberCard';
import { InviteMemberModal } from '@/components/InviteMemberModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Lock, Crown } from 'lucide-react';
import { toast } from 'sonner';

export function TeamManagement() {
  const { members, inviteMember, removeMember, updateMemberRole, remainingSeats, maxMembers, hasTeamFeatures } = useTeam();
  const { tier } = useTier();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleInvite = (email: string, role: 'admin' | 'editor' | 'viewer', name?: string) => {
    const result = inviteMember(email, role, name);
    if (result.success) {
      toast.success(`Invitation sent to ${email}`);
    } else {
      toast.error(result.error || 'Failed to send invitation');
    }
    return result;
  };

  const handleRemove = (id: string) => {
    const member = members.find(m => m.id === id);
    removeMember(id);
    toast.success(`${member?.name || 'Member'} has been removed`);
  };

  const handleUpdateRole = (id: string, role: 'owner' | 'admin' | 'editor' | 'viewer') => {
    updateMemberRole(id, role);
    toast.success('Role updated successfully');
  };

  if (!hasTeamFeatures) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Team Features Locked</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Redeem an Agency code in Settings → Billing to invite team members and collaborate on your tool stack.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage your team and their access levels
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {members.length}/{maxMembers} seats used
              </Badge>
              <Button 
                onClick={() => setIsInviteModalOpen(true)}
                disabled={remainingSeats === 0}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="font-medium mb-1">No team members yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Invite colleagues to collaborate on your tool stack
              </p>
              <Button onClick={() => setIsInviteModalOpen(true)} variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Send First Invite
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  currentUserRole="owner"
                  onUpdateRole={handleUpdateRole}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInvite}
        remainingSeats={remainingSeats}
      />
    </div>
  );
}
