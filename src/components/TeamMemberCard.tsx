import { TeamMember, TeamRole, ROLE_PERMISSIONS } from '@/types/team';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, ShieldCheck, Edit3, Eye, Trash2, Clock } from 'lucide-react';

interface TeamMemberCardProps {
  member: TeamMember;
  currentUserRole: TeamRole;
  onUpdateRole: (id: string, role: TeamRole) => void;
  onRemove: (id: string) => void;
}

const roleIcons: Record<TeamRole, typeof Shield> = {
  owner: ShieldCheck,
  admin: Shield,
  editor: Edit3,
  viewer: Eye,
};

const roleColors: Record<TeamRole, string> = {
  owner: 'bg-primary/20 text-primary',
  admin: 'bg-info/20 text-info',
  editor: 'bg-warning/20 text-warning',
  viewer: 'bg-muted text-muted-foreground',
};

export function TeamMemberCard({ member, currentUserRole, onUpdateRole, onRemove }: TeamMemberCardProps) {
  const RoleIcon = roleIcons[member.role];
  const canManage = ROLE_PERMISSIONS[currentUserRole].canManageTeam && member.role !== 'owner';
  const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/20 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{member.name}</span>
            {member.status === 'pending' && (
              <Badge variant="outline" className="text-xs gap-1">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">{member.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge className={`gap-1.5 ${roleColors[member.role]}`}>
          <RoleIcon className="h-3 w-3" />
          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
        </Badge>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUpdateRole(member.id, 'admin')}>
                <Shield className="mr-2 h-4 w-4" />
                Make Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateRole(member.id, 'editor')}>
                <Edit3 className="mr-2 h-4 w-4" />
                Make Editor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateRole(member.id, 'viewer')}>
                <Eye className="mr-2 h-4 w-4" />
                Make Viewer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onRemove(member.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
