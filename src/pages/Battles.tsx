import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StackBattle } from '@/components/StackBattle';
import { PublicProfile } from '@/components/PublicProfile';
import { useTools } from '@/hooks/useTools';
import { Swords, User } from 'lucide-react';

export default function Battles() {
  const { tools, setToolsDirectly } = useTools();
  
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
