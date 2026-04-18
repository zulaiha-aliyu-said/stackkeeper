import { useMemo } from 'react';
import { Tool } from '@/types/tool';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Stethoscope, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Pill,
  Heart,
  Activity,
  Zap,
  Trash2,
  Layers,
  ExternalLink
} from 'lucide-react';

interface StackHealthDoctorProps {
  tools: Tool[];
  onMarkAsUsed?: (toolId: string) => void;
  onDeleteTool?: (toolId: string) => void;
  onViewTool?: (tool: Tool) => void;
}

interface Prescription {
  action: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  actionType?: 'refund' | 'use' | 'consolidate' | 'none';
  toolId?: string;
  tool?: Tool;
  category?: string;
}

interface HealthDiagnosis {
  score: number;
  status: 'excellent' | 'healthy' | 'warning' | 'critical';
  strengths: { area: string; detail: string }[];
  warnings: { area: string; detail: string; value?: number }[];
  prescriptions: Prescription[];
}

export function StackHealthDoctor({ tools, onMarkAsUsed, onDeleteTool, onViewTool }: StackHealthDoctorProps) {
  const diagnosis = useMemo((): HealthDiagnosis => {
    if (tools.length === 0) {
      return {
        score: 0,
        status: 'critical',
        strengths: [],
        warnings: [{ area: 'Empty Stack', detail: 'No tools to analyze' }],
        prescriptions: [{ action: 'Add your first tool', impact: 'Start tracking your LTDs', priority: 'high' }],
      };
    }

    const usedTools = tools.filter(t => t.lastUsed !== null);
    const unusedTools = tools.filter(t => t.lastUsed === null);
    const totalInvestment = tools.reduce((sum, t) => sum + t.price, 0);
    const unusedValue = unusedTools.reduce((sum, t) => sum + t.price, 0);
    
    // Calculate usage rate
    const usageRate = (usedTools.length / tools.length) * 100;
    
    // Group by category for analysis
    const categoryGroups: Record<string, Tool[]> = {};
    tools.forEach(t => {
      if (!categoryGroups[t.category]) categoryGroups[t.category] = [];
      categoryGroups[t.category].push(t);
    });
    
    // Find high-ROI categories (categories where most tools are used)
    const highROICategories = Object.entries(categoryGroups)
      .filter(([_, catTools]) => {
        const usedInCat = catTools.filter(t => t.lastUsed !== null).length;
        return catTools.length > 0 && usedInCat / catTools.length >= 0.7;
      })
      .map(([cat]) => cat);
    
    // Find problem categories (many unused tools)
    const problemCategories = Object.entries(categoryGroups)
      .filter(([_, catTools]) => {
        const unusedInCat = catTools.filter(t => t.lastUsed === null).length;
        return catTools.length > 1 && unusedInCat >= 2;
      });
    
    // Find duplicate categories (multiple tools in same category)
    const duplicateCategories = Object.entries(categoryGroups)
      .filter(([_, catTools]) => catTools.length > 2)
      .map(([cat, catTools]) => ({ category: cat, count: catTools.length }));
    
    // Find expensive unused tools
    const expensiveUnused = unusedTools
      .filter(t => t.price >= 100)
      .sort((a, b) => b.price - a.price)
      .slice(0, 3);
    
    // Calculate health score
    let score = usageRate;
    
    // Bonus for diverse usage
    if (highROICategories.length >= 3) score += 5;
    
    // Penalties
    if (unusedValue > totalInvestment * 0.3) score -= 10;
    if (duplicateCategories.length > 2) score -= 5;
    
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    // Determine status
    let status: 'excellent' | 'healthy' | 'warning' | 'critical';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'healthy';
    else if (score >= 40) status = 'warning';
    else status = 'critical';
    
    // Build strengths
    const strengths: { area: string; detail: string }[] = [];
    if (highROICategories.length > 0) {
      strengths.push({
        area: `${highROICategories.slice(0, 2).join(' & ')} tools`,
        detail: 'High usage rate - great ROI!',
      });
    }
    if (usedTools.length > 0) {
      const frequentlyUsed = usedTools.filter(t => t.timesUsed >= 5);
      if (frequentlyUsed.length > 0) {
        strengths.push({
          area: 'Daily drivers',
          detail: `${frequentlyUsed.length} tool(s) used 5+ times`,
        });
      }
    }
    if (usageRate >= 70) {
      strengths.push({
        area: 'Stack efficiency',
        detail: `${Math.round(usageRate)}% of tools actively used`,
      });
    }
    
    // Build warnings
    const warnings: { area: string; detail: string; value?: number }[] = [];
    if (unusedTools.length > 0) {
      warnings.push({
        area: `${unusedTools.length} unused tool${unusedTools.length > 1 ? 's' : ''}`,
        detail: 'Never opened since purchase',
        value: unusedValue,
      });
    }
    if (unusedValue > 200) {
      warnings.push({
        area: 'Wasted licenses',
        detail: `$${unusedValue} in unused tools`,
        value: unusedValue,
      });
    }
    problemCategories.forEach(([cat, catTools]) => {
      const unusedCount = catTools.filter(t => !t.lastUsed).length;
      warnings.push({
        area: `${cat} tools`,
        detail: `${unusedCount} of ${catTools.length} unused`,
      });
    });
    
    // Build prescriptions with actionable data
    const prescriptions: Prescription[] = [];
    
    if (expensiveUnused.length > 0) {
      const topUnused = expensiveUnused[0];
      prescriptions.push({
        action: `Refund ${topUnused.name} ($${topUnused.price})`,
        impact: 'Recover your investment',
        priority: 'high',
        actionType: 'refund',
        toolId: topUnused.id,
        tool: topUnused,
      });
    }
    
    if (duplicateCategories.length > 0) {
      const worstDupe = duplicateCategories.sort((a, b) => b.count - a.count)[0];
      prescriptions.push({
        action: `Consolidate ${worstDupe.count} ${worstDupe.category} tools`,
        impact: `Keep the best, refund the rest`,
        priority: 'medium',
        actionType: 'consolidate',
        category: worstDupe.category,
      });
    }
    
    if (unusedTools.length > 0) {
      const cheapestUnused = unusedTools.sort((a, b) => a.price - b.price)[0];
      prescriptions.push({
        action: `Try using ${cheapestUnused.name}`,
        impact: 'You already paid for it!',
        priority: 'low',
        actionType: 'use',
        toolId: cheapestUnused.id,
        tool: cheapestUnused,
      });
    }
    
    if (prescriptions.length === 0) {
      prescriptions.push({
        action: 'Keep up the great work!',
        impact: 'Your stack is well-optimized',
        priority: 'low',
        actionType: 'none',
      });
    }
    
    return { score, status, strengths, warnings, prescriptions };
  }, [tools]);

  const getStatusColor = () => {
    switch (diagnosis.status) {
      case 'excellent': return 'text-success';
      case 'healthy': return 'text-info';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
    }
  };

  const getStatusBg = () => {
    switch (diagnosis.status) {
      case 'excellent': return 'bg-success/10 border-success/30';
      case 'healthy': return 'bg-info/10 border-info/30';
      case 'warning': return 'bg-warning/10 border-warning/30';
      case 'critical': return 'bg-destructive/10 border-destructive/30';
    }
  };

  const getProgressColor = () => {
    switch (diagnosis.status) {
      case 'excellent': return 'bg-success';
      case 'healthy': return 'bg-info';
      case 'warning': return 'bg-warning';
      case 'critical': return 'bg-destructive';
    }
  };

  const potentialScore = Math.min(100, diagnosis.score + (diagnosis.prescriptions.filter(p => p.priority === 'high').length * 10));

  return (
    <Card className={`border ${getStatusBg()} overflow-hidden`}>
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2.5 ${getStatusBg()}`}>
              <Stethoscope className={`h-6 w-6 ${getStatusColor()}`} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                🩺 Stack Health Report
              </CardTitle>
              <p className="text-sm text-muted-foreground">Dr. Stack's diagnosis</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getStatusColor()}`}>
              {diagnosis.score}%
            </div>
            <Badge variant="secondary" className="capitalize">
              {diagnosis.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Health Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Health</span>
            <span className="text-foreground font-medium">{diagnosis.score}% → {potentialScore}% potential</span>
          </div>
          <div className="relative">
            <Progress value={diagnosis.score} className="h-3" />
            <div 
              className={`absolute top-0 h-3 rounded-full opacity-30 ${getProgressColor()}`}
              style={{ width: `${potentialScore}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          {diagnosis.strengths.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Strong Areas
              </h4>
              <div className="space-y-2">
                {diagnosis.strengths.map((strength, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Heart className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{strength.area}</span>
                      <span className="text-muted-foreground"> - {strength.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {diagnosis.warnings.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Warning Signs
              </h4>
              <div className="space-y-2">
                {diagnosis.warnings.slice(0, 3).map((warning, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Activity className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{warning.area}</span>
                      <span className="text-muted-foreground"> - {warning.detail}</span>
                      {warning.value && (
                        <span className="text-warning font-medium"> (${warning.value})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Prescriptions with One-Click Actions */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            💊 Prescription
          </h4>
          <div className="space-y-3">
            {diagnosis.prescriptions.map((rx, i) => (
              <div 
                key={i} 
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  rx.priority === 'high' 
                    ? 'bg-primary/5 border-primary/20' 
                    : rx.priority === 'medium'
                    ? 'bg-warning/5 border-warning/20'
                    : 'bg-secondary/50 border-border'
                }`}
              >
                <div className={`font-bold text-lg ${
                  rx.priority === 'high' ? 'text-primary' : 
                  rx.priority === 'medium' ? 'text-warning' : 'text-muted-foreground'
                }`}>
                  {i + 1}.
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{rx.action}</p>
                  <p className="text-sm text-muted-foreground">{rx.impact}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* One-Click Action Buttons */}
                  {rx.actionType === 'refund' && rx.toolId && onDeleteTool && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteTool(rx.toolId!)}
                      className="gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Refund
                    </Button>
                  )}
                  {rx.actionType === 'use' && rx.toolId && onMarkAsUsed && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onMarkAsUsed(rx.toolId!)}
                      className="gap-1.5"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Use Now
                    </Button>
                  )}
                  {rx.actionType === 'consolidate' && rx.category && onViewTool && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // Find the first tool in that category to view
                        const categoryTool = tools.find(t => t.category === rx.category);
                        if (categoryTool) onViewTool(categoryTool);
                      }}
                      className="gap-1.5"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      Review
                    </Button>
                  )}
                  {rx.tool && onViewTool && rx.actionType !== 'none' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewTool(rx.tool!)}
                      className="gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </Button>
                  )}
                  <Badge 
                    variant={rx.priority === 'high' ? 'default' : 'secondary'}
                    className="shrink-0"
                  >
                    {rx.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up */}
        <div className={`rounded-lg p-4 ${getStatusBg()}`}>
          <p className={`text-sm ${getStatusColor()}`}>
            <TrendingUp className="h-4 w-4 inline mr-2" />
            <span className="font-medium">
              {diagnosis.status === 'excellent' 
                ? "Excellent work! Your stack is in peak condition. 🏆"
                : diagnosis.status === 'healthy'
                ? "Good progress! Keep using your tools regularly."
                : diagnosis.status === 'warning'
                ? "Follow this plan to reach 95% health!"
                : "Urgent attention needed! Start with the high-priority prescriptions."}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
