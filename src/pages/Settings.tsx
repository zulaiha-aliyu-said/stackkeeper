import { Layout } from '@/components/Layout';
import { TeamManagement } from '@/components/TeamManagement';
import { BrandSettings } from '@/components/BrandSettings';
import { StackSelector } from '@/components/StackSelector';
import { useTier } from '@/hooks/useTier';
import { useStacks } from '@/hooks/useStacks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  Users, 
  Palette, 
  CreditCard, 
  Layers,
  Crown,
  Check,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { tier, setTier, limits } = useTier();
  const { stacks, activeStack, deleteStack, hasMultipleStacks } = useStacks();

  const tiers = [
    {
      name: 'Starter',
      value: 'starter' as const,
      price: '$29',
      description: 'For casual LTD collectors',
      features: ['Up to 25 tools', 'Basic dashboard', 'Spending charts', 'Duplicate detection'],
    },
    {
      name: 'Pro',
      value: 'pro' as const,
      price: '$59',
      description: 'For serious collectors',
      features: ['Unlimited tools', 'ROI Calculator', 'Stack Health Doctor', 'Time Machine', 'Streaks & Achievements'],
    },
    {
      name: 'Agency',
      value: 'agency' as const,
      price: '$99',
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

        <Tabs defaultValue="billing" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
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
