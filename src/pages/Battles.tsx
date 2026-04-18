import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StackBattle } from '@/components/StackBattle';
import { PublicProfile } from '@/components/PublicProfile';
import { useTools } from '@/hooks/useTools';
import { useSocialSettings } from '@/hooks/useSocialSettings';
import { useTier } from '@/hooks/useTier';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Swords, User, Shield } from 'lucide-react';

export default function Battles() {
  const { tools, setToolsDirectly } = useTools();
  const { enableBattles, enablePublicProfile, canConfigureSocial } = useSocialSettings();
  const { isAgency } = useTier();
  
  // Get username from localStorage profile
  const getUsername = () => {
    const stored = localStorage.getItem('stackvault_profile');
    if (stored) {
      try {
        return JSON.parse(stored).username || 'anonymous';
      } catch {
        return 'anonymous';
      }
    }
    return 'anonymous';
  };

  const handleStealStack = (newTools: typeof tools) => {
    setToolsDirectly([...tools, ...newTools]);
  };

  // Show locked prompt if not Agency
  if (!isAgency) {
    return (
      <Layout>
        <div className="p-6">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle>Stack Battles - Agency Only</CardTitle>
              <CardDescription>
                Redeem an Agency code in Settings → Billing to unlock Stack Battles.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show opt-in prompt if battles not enabled
  if (!enableBattles) {
    return (
      <Layout>
        <div className="p-6">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <Swords className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle>Stack Battles Disabled</CardTitle>
              <CardDescription>
                Enable Stack Battles in Settings → Privacy to challenge friends and compete.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/settings'}
              >
                Go to Privacy Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <Tabs defaultValue="battles" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="battles" className="gap-2">
              <Swords className="h-4 w-4" />
              Stack Battles
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              My Profile
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="battles" className="mt-6">
            <StackBattle tools={tools} username={getUsername()} />
          </TabsContent>
          
          <TabsContent value="profile" className="mt-6">
            <PublicProfile tools={tools} onStealStack={handleStealStack} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
