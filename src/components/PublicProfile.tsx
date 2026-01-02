import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  User, Edit2, Save, Globe, Lock, Copy, ExternalLink, 
  Trophy, Package, DollarSign, Check, X, Sparkles
} from 'lucide-react';
import { Tool } from '@/types/tool';
import { UserProfile } from '@/types/profile';
import { toast } from 'sonner';

interface PublicProfileProps {
  tools: Tool[];
  onStealStack?: (tools: Tool[]) => void;
}

const PROFILE_STORAGE_KEY = 'stackvault_profile';

const defaultProfile: UserProfile = {
  username: '',
  displayName: 'Stack Owner',
  bio: 'Tool collector & efficiency enthusiast',
  isPublic: false,
  createdAt: new Date().toISOString(),
  badges: [],
  battleWins: 0,
  battleLosses: 0,
};

export function PublicProfile({ tools, onStealStack }: PublicProfileProps) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(defaultProfile);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
        setEditedProfile(parsed);
      } catch {
        // Use default
      }
    }
  }, []);

  const saveProfile = () => {
    // Validate username
    if (!editedProfile.username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(editedProfile.username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    setProfile(editedProfile);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(editedProfile));
    setIsEditing(false);
    toast.success('Profile saved!');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/profile/${profile.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Profile link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStealStack = () => {
    if (onStealStack) {
      // Create copies of the tools without sensitive info
      const publicTools = tools.map(t => ({
        ...t,
        id: crypto.randomUUID(),
        login: undefined,
        password: undefined,
        redemptionCode: undefined,
        notes: undefined,
        usageHistory: [],
        timesUsed: 0,
        lastUsed: null,
        addedDate: new Date().toISOString(),
      }));
      onStealStack(publicTools);
      toast.success('Stack copied to your collection!');
    }
  };

  // Calculate stats
  const usedTools = tools.filter(t => t.lastUsed !== null);
  const stackScore = tools.length > 0 ? Math.round((usedTools.length / tools.length) * 100) : 0;
  const totalInvestment = tools.reduce((sum, t) => sum + t.price, 0);

  // Get category breakdown for display
  const categoryCount: Record<string, number> = {};
  tools.forEach(t => {
    categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  // Generate shareable data for "Steal my stack"
  const generateStackData = () => {
    const publicStack = tools.map(t => ({
      name: t.name,
      category: t.category,
      platform: t.platform,
    }));
    return btoa(JSON.stringify(publicStack));
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/30 via-primary/20 to-accent/30" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center border-4 border-background">
              <User className="h-12 w-12 text-primary-foreground" />
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 pb-2">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Username</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">/profile/</span>
                      <Input
                        value={editedProfile.username}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                        placeholder="your_username"
                        className="max-w-[200px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Display Name</Label>
                    <Input
                      value={editedProfile.displayName}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Your Name"
                      className="max-w-[300px]"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{profile.displayName || 'Set up your profile'}</h2>
                  {profile.username && (
                    <p className="text-muted-foreground">@{profile.username}</p>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveProfile}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="mt-4">
            {isEditing ? (
              <div className="space-y-1">
                <Label className="text-xs">Bio</Label>
                <Textarea
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell others about your tool collection..."
                  className="max-w-[500px] resize-none"
                  rows={2}
                />
              </div>
            ) : (
              <p className="text-muted-foreground">{profile.bio}</p>
            )}
          </div>

          {/* Visibility Toggle */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Switch
                    checked={editedProfile.isPublic}
                    onCheckedChange={(checked) => setEditedProfile(prev => ({ ...prev, isPublic: checked }))}
                  />
                  <Label className="text-sm">
                    {editedProfile.isPublic ? (
                      <span className="flex items-center gap-1 text-green-500">
                        <Globe className="h-4 w-4" /> Public Profile
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Lock className="h-4 w-4" /> Private Profile
                      </span>
                    )}
                  </Label>
                </>
              ) : (
                <Badge variant={profile.isPublic ? 'default' : 'secondary'} className="gap-1">
                  {profile.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {profile.isPublic ? 'Public' : 'Private'}
                </Badge>
              )}
            </div>
            
            {profile.username && profile.isPublic && !isEditing && (
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            )}
          </div>

          {/* Battle Stats */}
          {(profile.battleWins > 0 || profile.battleLosses > 0) && (
            <div className="mt-4 flex gap-4">
              <Badge variant="outline" className="gap-1">
                <Trophy className="h-3 w-3 text-yellow-500" />
                {profile.battleWins} Wins
              </Badge>
              <Badge variant="outline" className="gap-1">
                {profile.battleLosses} Losses
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stack Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-3xl font-bold">{tools.length}</div>
            <div className="text-sm text-muted-foreground">Tools</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-3xl font-bold">${totalInvestment.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Invested</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-3xl font-bold">{stackScore}%</div>
            <div className="text-sm text-muted-foreground">Stack Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-3xl font-bold">{usedTools.length}</div>
            <div className="text-sm text-muted-foreground">Active Tools</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stack Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topCategories.map(([category, count]) => (
              <Badge key={category} variant="secondary" className="px-3 py-1">
                {category} <span className="ml-1 opacity-60">({count})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tool List Preview (Public View) */}
      {profile.isPublic && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">My Stack</CardTitle>
            <Button onClick={handleStealStack} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Steal My Stack
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tools.slice(0, 9).map((tool) => (
                <div
                  key={tool.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium">{tool.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-between">
                    <span>{tool.category}</span>
                    <Badge variant="outline" className="text-xs">
                      {tool.platform}
                    </Badge>
                  </div>
                </div>
              ))}
              {tools.length > 9 && (
                <div className="p-3 rounded-lg border bg-muted/30 flex items-center justify-center text-muted-foreground">
                  +{tools.length - 9} more tools
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shareable Link Section */}
      {profile.username && profile.isPublic && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Your Public Profile
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Share your stack with the world. Others can view and copy your tools.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopyLink} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Link
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/profile/${profile.username}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
