import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, Package, DollarSign, Trophy, Sparkles, 
  Copy, Check, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tool } from '@/types/tool';
import { UserProfile } from '@/types/profile';
import { useTools } from '@/hooks/useTools';
import { toast } from 'sonner';

export default function Profile() {
  const { username } = useParams();
  const { tools: myTools, setToolsDirectly } = useTools();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileTools, setProfileTools] = useState<Tool[]>([]);
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // In a real app, this would fetch from an API
    // For demo, we check if it's the current user's profile
    const stored = localStorage.getItem('stackvault_profile');
    const storedTools = localStorage.getItem('stackvault_tools');
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.username === username) {
          setProfile(parsed);
          setIsOwner(true);
          if (storedTools) {
            setProfileTools(JSON.parse(storedTools));
          }
        } else {
          // Not found - show demo profile
          setProfile({
            username: username || '',
            displayName: username || 'Unknown User',
            bio: 'This profile is not public or does not exist.',
            isPublic: false,
            createdAt: new Date().toISOString(),
            badges: [],
            battleWins: 0,
            battleLosses: 0,
          });
        }
      } catch {
        // Handle error
      }
    }
  }, [username]);

  const handleStealStack = () => {
    if (profileTools.length === 0) return;
    
    const newTools = profileTools.map(t => ({
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
    
    setToolsDirectly([...myTools, ...newTools]);
    toast.success(`Added ${newTools.length} tools to your stack!`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!profile) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This profile doesn't exist or is private.
              </p>
              <Button asChild>
                <Link to="/battles">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Battles
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!profile.isPublic && !isOwner) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Private Profile</h2>
              <p className="text-muted-foreground mb-4">
                @{username}'s profile is set to private.
              </p>
              <Button asChild>
                <Link to="/battles">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Battles
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Calculate stats
  const usedTools = profileTools.filter(t => t.lastUsed !== null);
  const stackScore = profileTools.length > 0 
    ? Math.round((usedTools.length / profileTools.length) * 100) 
    : 0;
  const totalInvestment = profileTools.reduce((sum, t) => sum + t.price, 0);

  // Get category breakdown
  const categoryCount: Record<string, number> = {};
  profileTools.forEach(t => {
    categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild>
          <Link to="/battles">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>

        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/30 via-primary/20 to-accent/30" />
          <CardContent className="relative pt-0">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center border-4 border-background shadow-xl">
                <User className="h-16 w-16 text-primary-foreground" />
              </div>
              
              <div className="flex-1 pb-2">
                <h1 className="text-3xl font-bold">{profile.displayName}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                <p className="mt-2 text-muted-foreground">{profile.bio}</p>
              </div>

              <div className="flex gap-2 pb-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? 'Copied!' : 'Share'}
                </Button>
                {!isOwner && profileTools.length > 0 && (
                  <Button size="sm" onClick={handleStealStack} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Steal Stack
                  </Button>
                )}
              </div>
            </div>

            {/* Battle Stats */}
            {(profile.battleWins > 0 || profile.battleLosses > 0) && (
              <div className="mt-4 flex gap-4">
                <Badge variant="outline" className="gap-1">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  {profile.battleWins} Wins
                </Badge>
                <Badge variant="outline">
                  {profile.battleLosses} Losses
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">{profileTools.length}</div>
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
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        {topCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Categories</CardTitle>
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
        )}

        {/* Tools Grid */}
        {profileTools.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Stack Collection</CardTitle>
              {!isOwner && (
                <Button onClick={handleStealStack} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Steal My Stack
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {profileTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-between mt-1">
                      <span>{tool.category}</span>
                      <Badge variant="outline" className="text-xs">
                        {tool.platform}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
