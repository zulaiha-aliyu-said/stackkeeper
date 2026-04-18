import { Layout } from '@/components/Layout';
import { EmptyState } from '@/components/EmptyState';
import { ToolRelationshipNetwork } from '@/components/ToolRelationshipNetwork';
import { useTools } from '@/hooks/useTools';
import { Network } from 'lucide-react';

export default function NetworkPage() {
  const { tools } = useTools();

  if (tools.length === 0) {
    return (
      <Layout>
        <EmptyState
          icon={Network}
          title="No data yet"
          description="Add some tools to your vault to see the relationship network between your tools."
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tool Network</h1>
          <p className="text-muted-foreground mt-1">Visualize connections and workflows between your tools</p>
        </div>

        {/* Network Graph */}
        <ToolRelationshipNetwork tools={tools} />
      </div>
    </Layout>
  );
}
