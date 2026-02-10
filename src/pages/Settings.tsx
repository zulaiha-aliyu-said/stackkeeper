import { Layout } from '@/components/Layout';
import { TeamManagement } from '@/components/TeamManagement';
import { BrandSettings } from '@/components/BrandSettings';
import { StackSelector } from '@/components/StackSelector';
import { useTier } from '@/hooks/useTier';
import { useStacks } from '@/hooks/useStacks';
import { useInterfaceMode } from '@/hooks/useInterfaceMode';
import { useSocialSettings } from '@/hooks/useSocialSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Settings as SettingsIcon, 
  Users, 
  Palette, 
  CreditCard, 
  Layers,
  Crown,
  Check,
  Trash2,
  Zap,
  Leaf,
  Shield,
  Swords,
  Globe,
  Copy,
  Ticket,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Settings() {
  const { tier, setTier, limits, isAgency, redeemCode } = useTier();
  const [redeemInput, setRedeemInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const { stacks, activeStack, deleteStack, hasMultipleStacks } = useStacks();
  const { mode, setMode, isSimpleMode } = useInterfaceMode();
  const { 
    settings: socialSettings, 
    updateSettings: updateSocialSettings,
    canConfigureSocial
  } = useSocialSettings();

  const handleRedeem = async () => {
    if (!redeemInput.trim()) return;
    setRedeeming(true);
    const success = await redeemCode(redeemInput);
    if (success) setRedeemInput('');
    setRedeeming(false);
  };

  const tiers = [
    {
      name: 'Starter',
      value: 'starter' as const,
      price: '$49',
      description: 'For casual LTD collectors',
      features: ['Up to 25 tools', 'Basic dashboard', 'Spending charts', 'Duplicate detection'],
    },
    {
      name: 'Pro',
      value: 'pro' as const,
      price: '$99',
      description: 'For serious collectors',
      features: ['Unlimited tools', 'ROI Calculator', 'Stack Health Doctor', 'Time Machine', 'Streaks & Achievements'],
    },
    {
      name: 'Agency',
      value: 'agency' as const,
      price: '$149',
      description: 'For agencies & power users',
      features: ['Everything in Pro', 'Up to 5 stacks', '3 team members', 'Custom branding', 'Stack Battles'],
    },
  ];

  const handleDeleteStack = (stackId: string) => {
    const stack = stacks.find(s => s.id === stackId);
    if (!stack) return;
    
    const result = deleteStack(stackId);
    if (result.success) {
      toast.success(`Stack "${stack.name}" deleted`);
    } else {
      toast.error(result.error || 'Failed to delete stack');
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account, team, and preferences
          </p>
        </div>

        <Tabs defaultValue="preferences" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-6">
            <TabsTrigger value="preferences" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Mode</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="stacks" className="gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Stacks</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
          </TabsList>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interface Mode</CardTitle>
                <CardDescription>
                  Choose how much you want to see. Start simple, unlock power when you're ready.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    onClick={() => setMode('simple')}
                    className={`relative rounded-xl border p-6 text-left transition-all ${
                      isSimpleMode 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {isSimpleMode && (
                      <Badge className="absolute -top-2 right-4">Active</Badge>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <Leaf className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-lg">Simple Mode</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Essential tools for tracking your stack. Clean, focused, no overwhelm.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Dashboard with core metrics
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Tool Library
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Refund alerts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Settings
                      </li>
                    </ul>
                  </button>

                  <button
                    onClick={() => setMode('power')}
                    className={`relative rounded-xl border p-6 text-left transition-all ${
                      !isSimpleMode 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {!isSimpleMode && (
                      <Badge className="absolute -top-2 right-4">Active</Badge>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">Power Mode</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Advanced analytics and insights for serious collectors.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Everything in Simple
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Analytics & ROI tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Stack Health Doctor
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Network visualization
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Time Machine & more
                      </li>
                    </ul>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social/Privacy Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Controls
                </CardTitle>
                <CardDescription>
                  Your stack, your rules. Enable only the social features you want.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!canConfigureSocial ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Social Features - Agency Only</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Upgrade to Agency to access social features like Stack Battles, public profiles, and stack sharing.
                    </p>
                    <Button 
                      className="mt-4 gap-2"
                      onClick={() => {
                        setTier('agency');
                        toast.success('Upgraded to Agency plan');
                      }}
                    >
                      <Crown className="h-4 w-4" />
                      Upgrade to Agency
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Stack Battles Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-secondary">
                          <Swords className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <Label className="text-base font-medium">Stack Battles</Label>
                          <p className="text-sm text-muted-foreground">
                            Challenge friends and compare tool collections
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={socialSettings.enableBattles}
                        onCheckedChange={(checked) => {
                          updateSocialSettings({ enableBattles: checked });
                          toast.success(checked ? 'Stack Battles enabled' : 'Stack Battles disabled');
                        }}
                      />
                    </div>

                    {/* Public Profile Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-secondary">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <Label className="text-base font-medium">Public Profile</Label>
                          <p className="text-sm text-muted-foreground">
                            Share your stack publicly at username.stackvault.app
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={socialSettings.enablePublicProfile}
                        onCheckedChange={(checked) => {
                          updateSocialSettings({ enablePublicProfile: checked });
                          toast.success(checked ? 'Public Profile enabled' : 'Public Profile disabled');
                        }}
                      />
                    </div>

                    {/* Steal My Stack Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-secondary">
                          <Copy className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <Label className="text-base font-medium">Stack Sharing</Label>
                          <p className="text-sm text-muted-foreground">
                            Let visitors copy your tool list with one click
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={socialSettings.enableStealMyStack}
                        onCheckedChange={(checked) => {
                          updateSocialSettings({ enableStealMyStack: checked });
                          toast.success(checked ? 'Stack Sharing enabled' : 'Stack Sharing disabled');
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  You are currently on the <span className="font-semibold capitalize">{tier}</span> plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {tiers.map((t) => (
                    <div
                      key={t.value}
                      className={`relative rounded-xl border p-6 transition-all ${
                        tier === t.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {tier === t.value && (
                        <Badge className="absolute -top-2 right-4">Current</Badge>
                      )}
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg">{t.name}</h3>
                        <p className="text-2xl font-bold">{t.price}</p>
                        <p className="text-xs text-muted-foreground">one-time</p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{t.description}</p>
                      <ul className="space-y-2">
                        {t.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {tier !== t.value && (
                        <Button 
                          className="w-full mt-4 gap-2"
                          variant={t.value === 'agency' ? 'default' : 'outline'}
                          onClick={() => {
                            setTier(t.value);
                            toast.success(`Switched to ${t.name} plan`);
                          }}
                        >
                          {t.value === 'agency' && <Crown className="h-4 w-4" />}
                          {tier === 'agency' ? 'Switch' : 'Upgrade'} to {t.name}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Redeem Code Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Redeem a Code
                </CardTitle>
                <CardDescription>
                  Have a lifetime deal code? Enter it below to unlock your plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 max-w-md">
                  <Input
                    placeholder="SV-PRO-XXXXXXXX"
                    value={redeemInput}
                    onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
                    className="font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
                  />
                  <Button onClick={handleRedeem} disabled={redeeming || !redeemInput.trim()} className="gap-2">
                    {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
                    Redeem
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Limits</CardTitle>
                <CardDescription>Your current plan includes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground">Max Tools</p>
                    <p className="text-2xl font-bold">
                      {limits.maxTools === Infinity ? '∞' : limits.maxTools}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground">Max Stacks</p>
                    <p className="text-2xl font-bold">{limits.maxStacks}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground">Team Members</p>
                    <p className="text-2xl font-bold">{limits.maxTeamMembers}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground">Features</p>
                    <p className="text-2xl font-bold capitalize">{tier}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stacks Tab */}
          <TabsContent value="stacks" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Your Stacks
                    </CardTitle>
                    <CardDescription>
                      {hasMultipleStacks 
                        ? 'Manage your tool stacks for different projects or clients'
                        : 'Upgrade to Agency to manage multiple stacks'
                      }
                    </CardDescription>
                  </div>
                  {hasMultipleStacks && (
                    <StackSelector showLabel={false} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stacks.map((stack) => (
                    <div 
                      key={stack.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        stack.id === activeStack?.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stack.name}</span>
                          {stack.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          {stack.id === activeStack?.id && (
                            <Badge variant="outline" className="text-primary">Active</Badge>
                          )}
                        </div>
                        {stack.description && (
                          <p className="text-sm text-muted-foreground">{stack.description}</p>
                        )}
                      </div>
                      {!stack.isDefault && hasMultipleStacks && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteStack(stack.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <BrandSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
