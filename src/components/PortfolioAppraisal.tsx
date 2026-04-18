import { Tool } from '@/types/tool';
import { Briefcase, TrendingUp, DollarSign, Sparkles, ArrowUp } from 'lucide-react';

interface PortfolioAppraisalProps {
  tools: Tool[];
  totalInvestment: number;
}

// Estimated annual subscription values by category (conservative estimates)
const CATEGORY_ANNUAL_VALUES: Record<string, number> = {
  'Marketing': 180,
  'Design': 240,
  'Productivity': 120,
  'AI': 300,
  'Dev Tools': 200,
  'Analytics': 180,
  'Email': 150,
  'Video': 200,
  'Other': 100,
};

export function PortfolioAppraisal({ tools, totalInvestment }: PortfolioAppraisalProps) {
  // Calculate total annual value
  const calculateAnnualValue = (tool: Tool): number => {
    if (tool.annualValue) return tool.annualValue;
    // Use category-based estimate if no custom value set
    return CATEGORY_ANNUAL_VALUES[tool.category] || 100;
  };

  const totalAnnualValue = tools.reduce((sum, tool) => sum + calculateAnnualValue(tool), 0);
  const totalLifetimeValue = totalAnnualValue * 5; // Assuming 5-year tool lifespan
  const roi = totalInvestment > 0 ? ((totalAnnualValue - totalInvestment) / totalInvestment * 100) : 0;
  const savingsFirstYear = totalAnnualValue - totalInvestment;
  const savingsMultiplier = totalInvestment > 0 ? (totalLifetimeValue / totalInvestment) : 0;

  // Find top value tools
  const topValueTools = [...tools]
    .sort((a, b) => calculateAnnualValue(b) - calculateAnnualValue(a))
    .slice(0, 3);

  return (
    <div className="metric-card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/20">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Portfolio Appraisal</h3>
          <p className="text-xs text-muted-foreground">What your stack is worth</p>
        </div>
      </div>

      {/* Main Value Display */}
      <div className="text-center mb-6 p-4 rounded-xl bg-background/50">
        <p className="text-sm text-muted-foreground mb-1">Annual Subscription Value</p>
        <p className="text-4xl font-bold text-primary">${totalAnnualValue.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground mt-2">
          You paid <span className="font-semibold text-foreground">${totalInvestment.toLocaleString()}</span> for{' '}
          <span className="font-semibold text-foreground">${totalAnnualValue.toLocaleString()}/year</span> in value
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">5-Year Value</span>
          </div>
          <p className="text-xl font-bold text-foreground">${totalLifetimeValue.toLocaleString()}</p>
        </div>
        
        <div className="p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-warning" />
            <span className="text-xs text-muted-foreground">ROI Multiplier</span>
          </div>
          <p className="text-xl font-bold text-foreground">{savingsMultiplier.toFixed(1)}x</p>
        </div>
        
        <div className="p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUp className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">First Year ROI</span>
          </div>
          <p className={`text-xl font-bold ${roi >= 0 ? 'text-success' : 'text-destructive'}`}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
          </p>
        </div>
        
        <div className="p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Year 1 Savings</span>
          </div>
          <p className={`text-xl font-bold ${savingsFirstYear >= 0 ? 'text-success' : 'text-destructive'}`}>
            {savingsFirstYear >= 0 ? '+' : ''}${Math.abs(savingsFirstYear).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Top Value Tools */}
      {topValueTools.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Highest Value Tools</p>
          <div className="space-y-2">
            {topValueTools.map((tool, index) => (
              <div key={tool.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">#{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{tool.name}</span>
                </div>
                <span className="text-sm font-semibold text-success">
                  ${calculateAnnualValue(tool)}/yr
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20">
        <p className="text-sm text-success text-center">
          🎉 Your stack saves you <strong>${(totalAnnualValue - totalInvestment).toLocaleString()}</strong> in year one alone!
        </p>
      </div>
    </div>
  );
}
