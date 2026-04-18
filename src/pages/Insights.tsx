import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { EmptyState } from '@/components/EmptyState';
import { TimeMachine } from '@/components/TimeMachine';
import { WhatIfCalculator } from '@/components/WhatIfCalculator';
import { useTools } from '@/hooks/useTools';
import { Sparkles } from 'lucide-react';

export default function Insights() {
  const { tools } = useTools();

  if (tools.length === 0) {
    return (
      <Layout>
        <EmptyState
          icon={Sparkles}
          title="No data yet"
          description="Add some tools to your vault to see insights and predictions about your lifetime deal collection."
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Insights</h1>
          <p className="text-muted-foreground mt-1">Time travel through your stack and explore what-if scenarios</p>
        </div>

        {/* Time Machine */}
        <TimeMachine tools={tools} />

        {/* What If Calculator */}
        <WhatIfCalculator tools={tools} />
      </div>
    </Layout>
  );
}
