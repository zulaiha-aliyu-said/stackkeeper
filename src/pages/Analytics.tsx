import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { EmptyState } from '@/components/EmptyState';
import { ROILeaderboard } from '@/components/ROILeaderboard';
import { ToolDetailModal } from '@/components/ToolDetailModal';
import { AddToolModal } from '@/components/AddToolModal';
import { SpendingChart } from '@/components/SpendingChart';
import { CategoryChart } from '@/components/CategoryChart';
import { UsageChart } from '@/components/UsageChart';
import { AchievementsPanel } from '@/components/AchievementsPanel';
import { UsageHistoryLog } from '@/components/UsageHistoryLog';
import { useTools } from '@/hooks/useTools';
import { Tool } from '@/types/tool';
import { DollarSign, PieChart, TrendingUp, Globe, BarChart3, Activity, Trophy } from 'lucide-react';

export default function Analytics() {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const {
    tools,
    totalInvestment,
    activeToolsValue,
    unusedToolsValue,
    usedTools,
    unusedTools,
    stackScore,
    getCategoryBreakdown,
    getPlatformBreakdown,
    updateTool,
    deleteTool,
    markAsUsed,
    addTool,
  } = useTools();

  const categoryBreakdown = getCategoryBreakdown();
  const platformBreakdown = getPlatformBreakdown();

  const getStackScoreEmoji = () => {
    if (stackScore >= 70) return '🏆';
    if (stackScore >= 50) return '✅';
    if (stackScore >= 30) return '⚠️';
    return '🚨';
  };

  const getStackScoreMessage = () => {
    if (stackScore >= 70) return 'Excellent! You\'re maximizing your investments.';
    if (stackScore >= 50) return 'Good progress! Keep using your tools.';
    if (stackScore >= 30) return 'Room for improvement. Try some unused tools!';
    return 'Many tools need attention. Start exploring!';
  };

  const avgToolPrice = tools.length > 0 
    ? Math.round(totalInvestment / tools.length) 
    : 0;

  if (tools.length === 0) {
    return (
      <Layout>
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Add some tools to your vault to see analytics and insights about your lifetime deal collection."
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Insights into your tool investments</p>
        </div>

        {/* ROI Leaderboard */}
        <ROILeaderboard tools={tools} onViewTool={setSelectedTool} />

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spend Breakdown */}
          <div className="metric-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-primary/10 p-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Spend Breakdown</h3>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Investment</p>
                <p className="text-4xl font-bold text-foreground">${totalInvestment.toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Active Tools Value</span>
                    <span className="text-success font-medium">${activeToolsValue.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill bg-success"
                      style={{ width: `${totalInvestment > 0 ? (activeToolsValue / totalInvestment) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Unused Tools Value</span>
                    <span className="text-warning font-medium">${unusedToolsValue.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill bg-warning"
                      style={{ width: `${totalInvestment > 0 ? (unusedToolsValue / totalInvestment) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stack Score Details */}
          <div className="metric-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-primary/10 p-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Stack Score™</h3>
            </div>

            <div className="flex flex-col items-center py-6">
              <div className="text-6xl mb-2">{getStackScoreEmoji()}</div>
              <div className="text-5xl font-bold text-foreground mb-2">{stackScore}%</div>
              <p className="text-muted-foreground text-center max-w-xs">{getStackScoreMessage()}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{usedTools.length}</p>
                <p className="text-xs text-muted-foreground">Tools Used</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">{unusedTools.length}</p>
                <p className="text-xs text-muted-foreground">Never Opened</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">${avgToolPrice}</p>
                <p className="text-xs text-muted-foreground">Avg Price</p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="metric-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-primary/10 p-2">
                <PieChart className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Tools by Category</h3>
            </div>

            <div className="space-y-4">
              {Object.entries(categoryBreakdown)
                .sort((a, b) => b[1].spend - a[1].spend)
                .map(([category, { count, spend }]) => (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground font-medium">{category}</span>
                      <span className="text-muted-foreground">{count} tools • ${spend}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(spend / totalInvestment) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Platform Distribution */}
          <div className="metric-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-info/10 p-2">
                <Globe className="h-5 w-5 text-info" />
              </div>
              <h3 className="font-semibold text-foreground">Platform Distribution</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries(platformBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => (
                  <div 
                    key={platform}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                  >
                    <span className="font-medium text-foreground">{platform}</span>
                    <span className="badge-platform">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending Over Time */}
          <div className="metric-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-success/10 p-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <h3 className="font-semibold text-foreground">Spending Over Time</h3>
            </div>
            <SpendingChart tools={tools} />
          </div>

          {/* Category Breakdown Chart */}
          <div className="metric-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-info/10 p-2">
                <PieChart className="h-5 w-5 text-info" />
              </div>
              <h3 className="font-semibold text-foreground">Category Distribution</h3>
            </div>
            <CategoryChart tools={tools} />
          </div>
        </div>

        {/* Usage Chart - Full Width */}
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-primary/10 p-2">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Tool Usage Ranking</h3>
          </div>
          <UsageChart tools={tools} />
        </div>

        {/* Usage History */}
        <UsageHistoryLog tools={tools} />

        {/* Achievements */}
        <AchievementsPanel 
          tools={tools} 
          totalInvestment={totalInvestment} 
          stackScore={stackScore} 
        />
      </div>

      {selectedTool && (
        <ToolDetailModal
          tool={selectedTool}
          isOpen={!!selectedTool}
          onClose={() => setSelectedTool(null)}
          onMarkAsUsed={markAsUsed}
          onEdit={(tool) => {
            setEditTool(tool);
            setIsAddModalOpen(true);
          }}
          onDelete={deleteTool}
        />
      )}

      <AddToolModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditTool(null);
        }}
        onAdd={addTool}
        editTool={editTool}
        onUpdate={updateTool}
      />
    </Layout>
  );
}
