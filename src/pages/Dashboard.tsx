import { useState } from 'react';
import { Package, DollarSign, TrendingUp, AlertTriangle, Plus, Zap, Ghost, Share2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { MetricCard } from '@/components/MetricCard';
import { RefundTimer } from '@/components/RefundTimer';
import { EmptyState } from '@/components/EmptyState';
import { AddToolModal } from '@/components/AddToolModal';
import { ToolDetailModal } from '@/components/ToolDetailModal';
import { DuplicateAlert } from '@/components/DuplicateAlert';
import { ShareStackModal } from '@/components/ShareStackModal';
import { WeeklyUsageSummary } from '@/components/WeeklyUsageSummary';
import { DailyUsagePrompt } from '@/components/DailyUsagePrompt';
import { ActiveTimersIndicator } from '@/components/UsageTimer';
import { GoalsOverview } from '@/components/UsageGoalProgress';
import { PortfolioAppraisal } from '@/components/PortfolioAppraisal';
import { useTools } from '@/hooks/useTools';
import { Tool } from '@/types/tool';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { 
    tools, 
    addTool, 
    updateTool,
    deleteTool,
    markAsUsed,
    bulkMarkAsUsed,
    totalInvestment, 
    stackScore, 
    getRefundAlerts,
    getRecentlyAdded,
    getToolGraveyard,
    getDuplicates
  } = useTools();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const [dismissedDuplicates, setDismissedDuplicates] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const refundAlerts = getRefundAlerts();
  const recentTools = getRecentlyAdded();
  const graveyardTools = getToolGraveyard();

  const getStackScoreEmoji = () => {
    if (stackScore >= 70) return '🏆';
    if (stackScore >= 50) return '✅';
    if (stackScore >= 30) return '⚠️';
    return '🚨';
  };

  if (tools.length === 0) {
    return (
      <Layout>
        <EmptyState
          icon={Package}
          title="Your vault is empty"
          description="Start tracking your lifetime deals by adding your first tool. Never forget what you own again!"
          action={{
            label: 'Add Your First Tool',
            onClick: () => setIsAddModalOpen(true)
          }}
        />
        <AddToolModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={addTool}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Your lifetime deal command center</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Share2 className="h-5 w-5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Tool
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Tools"
            value={tools.length}
            subtitle="in your vault"
            icon={Package}
          />
          <MetricCard
            title="Total Invested"
            value={`$${totalInvestment.toLocaleString()}`}
            subtitle="lifetime value"
            icon={DollarSign}
            iconColor="text-success"
          />
          <MetricCard
            title="Stack Score™"
            value={`${stackScore}%`}
            subtitle={`${getStackScoreEmoji()} usage rate`}
            icon={TrendingUp}
            iconColor={stackScore >= 50 ? 'text-success' : 'text-warning'}
          />
          <MetricCard
            title="Refund Alerts"
            value={refundAlerts.length}
            subtitle={refundAlerts.length > 0 ? 'need attention' : 'all clear'}
            icon={AlertTriangle}
            iconColor={refundAlerts.length > 0 ? 'text-warning' : 'text-muted-foreground'}
          />
        </div>

        {/* Duplicate Alert */}
        {!dismissedDuplicates && getDuplicates.length > 0 && (
          <DuplicateAlert
            duplicates={getDuplicates}
            onDismiss={() => setDismissedDuplicates(true)}
            onViewTool={(tool) => setSelectedTool(tool)}
          />
        )}

        {/* Refund Timer */}
        <RefundTimer 
          alerts={refundAlerts} 
          onViewTool={(tool) => setSelectedTool(tool)} 
        />

        {/* Weekly Usage Summary */}
        <WeeklyUsageSummary tools={tools} />

        {/* Portfolio Appraisal */}
        <PortfolioAppraisal tools={tools} totalInvestment={totalInvestment} />

        {/* Goals Overview */}
        <GoalsOverview tools={tools} />

        {/* Two Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recently Added */}
          <div className="metric-card">
            <div className="flex items-center gap-3 mb-4">
              <Plus className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Recently Added</h3>
            </div>
            <div className="space-y-3">
              {recentTools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-foreground">{tool.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${tool.price} • {formatDistanceToNow(new Date(tool.addedDate), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="badge-category text-xs">{tool.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tool Graveyard */}
          <div className="metric-card">
            <div className="flex items-center gap-3 mb-4">
              <Ghost className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Tool Graveyard</h3>
            </div>
            {graveyardTools.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">🎉 You're using all your tools!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {graveyardTools.slice(0, 5).map(tool => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{tool.name}</p>
                      <p className="text-sm text-muted-foreground">${tool.price} • Never used</p>
                    </div>
                    <button
                      onClick={() => markAsUsed(tool.id)}
                      className="btn-secondary text-xs flex items-center gap-1"
                    >
                      <Zap className="h-3 w-3" />
                      Mark Used
                    </button>
                  </div>
                ))}
                {graveyardTools.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{graveyardTools.length - 5} more unused tools
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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

      <ShareStackModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tools={tools}
        totalInvestment={totalInvestment}
        stackScore={stackScore}
      />

      {/* Daily Usage Prompt */}
      <DailyUsagePrompt tools={tools} onMarkAsUsed={bulkMarkAsUsed} />

      {/* Active Timers Indicator */}
      <ActiveTimersIndicator />
    </Layout>
  );
}
