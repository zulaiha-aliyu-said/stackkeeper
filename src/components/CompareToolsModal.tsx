import { X, Trophy, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Tool, getPlatformLabel } from '@/types/tool';
import { calculateROI, ROIMetrics } from '@/lib/roi';
import { format, formatDistanceToNow } from 'date-fns';

interface CompareToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: Tool[];
}

export function CompareToolsModal({ isOpen, onClose, tools }: CompareToolsModalProps) {
  if (!isOpen || tools.length < 2) return null;

  const toolsWithROI = tools.map(tool => ({
    tool,
    roi: calculateROI(tool),
  }));

  // Find best/worst for each metric
  const getBestIndex = (getValue: (t: Tool, r: ROIMetrics) => number, higherIsBetter = true) => {
    let bestIdx = 0;
    let bestVal = getValue(tools[0], toolsWithROI[0].roi);
    tools.forEach((t, i) => {
      const val = getValue(t, toolsWithROI[i].roi);
      if (higherIsBetter ? val > bestVal : val < bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    });
    return bestIdx;
  };

  const mostUsedIdx = getBestIndex((t) => t.timesUsed, true);
  const lowestCostPerUseIdx = getBestIndex((_, r) => r.costPerUse ?? Infinity, false);
  const lowestPriceIdx = getBestIndex((t) => t.price, false);

  const getRecommendation = () => {
    // Find the tool with best overall value
    const scores = toolsWithROI.map(({ tool, roi }, idx) => {
      let score = 0;
      if (idx === mostUsedIdx) score += 3;
      if (idx === lowestCostPerUseIdx) score += 2;
      if (tool.timesUsed > 0) score += 1;
      if (roi.status === 'excellent') score += 2;
      else if (roi.status === 'good') score += 1;
      return { tool, score, roi };
    });

    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];
    const others = scores.slice(1);

    if (best.score === 0) {
      return {
        text: "None of these tools are being used. Consider refunding all before deadlines.",
        action: "Refund All",
        bestTool: null,
      };
    }

    if (others.every(o => o.tool.timesUsed === 0)) {
      return {
        text: `${best.tool.name} is the only tool being used. Consider refunding the others.`,
        action: `Keep ${best.tool.name}`,
        bestTool: best.tool,
      };
    }

    return {
      text: `${best.tool.name} has the best usage and ROI. Consider consolidating to this tool.`,
      action: `Keep ${best.tool.name}`,
      bestTool: best.tool,
    };
  };

  const recommendation = getRecommendation();

  const getStatusIcon = (status: ROIMetrics['status']) => {
    switch (status) {
      case 'excellent': return <Trophy className="h-4 w-4 text-success" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'fair': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'poor': return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getCellClass = (idx: number, bestIdx: number) => {
    return idx === bestIdx ? 'bg-success/10 text-success font-semibold' : '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl animate-scale-in m-4">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-foreground">Compare Tools</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Feature</th>
                  {tools.map(tool => (
                    <th key={tool.id} className="text-center py-3 px-4 text-sm font-semibold text-foreground min-w-[140px]">
                      {tool.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr>
                  <td className="py-3 px-4 text-sm text-muted-foreground">Price Paid</td>
                  {tools.map((tool, idx) => (
                    <td key={tool.id} className={`py-3 px-4 text-center text-sm ${getCellClass(idx, lowestPriceIdx)}`}>
                      ${tool.price}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-muted-foreground">Purchase Date</td>
                  {tools.map(tool => (
                    <td key={tool.id} className="py-3 px-4 text-center text-sm text-foreground">
                      {format(new Date(tool.purchaseDate), 'MMM yyyy')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-muted-foreground">Times Used</td>
                  {tools.map((tool, idx) => (
                    <td key={tool.id} className={`py-3 px-4 text-center text-sm ${getCellClass(idx, mostUsedIdx)}`}>
                      {tool.timesUsed}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-muted-foreground">Last Used</td>
                  {tools.map(tool => (
                    <td key={tool.id} className="py-3 px-4 text-center text-sm text-foreground">
                      {tool.lastUsed 
                        ? formatDistanceToNow(new Date(tool.lastUsed), { addSuffix: true })
                        : 'Never'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-muted-foreground">Cost Per Use</td>
                  {toolsWithROI.map(({ tool, roi }, idx) => (
                    <td key={tool.id} className={`py-3 px-4 text-center text-sm ${getCellClass(idx, lowestCostPerUseIdx)}`}>
                      {roi.costPerUse !== null ? `$${roi.costPerUse.toFixed(2)}` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-muted-foreground">Days Owned</td>
                  {toolsWithROI.map(({ tool, roi }) => (
                    <td key={tool.id} className="py-3 px-4 text-center text-sm text-foreground">
                      {roi.daysOwned}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-muted-foreground">Category</td>
                  {tools.map(tool => (
                    <td key={tool.id} className="py-3 px-4 text-center text-sm text-foreground">
                      {tool.category}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-muted-foreground">Platform</td>
                  {tools.map(tool => (
                    <td key={tool.id} className="py-3 px-4 text-center text-sm text-foreground">
                      {getPlatformLabel(tool.platform)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-muted-foreground">ROI Status</td>
                  {toolsWithROI.map(({ tool, roi }) => (
                    <td key={tool.id} className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(roi.status)}
                        <span className="text-sm capitalize">{roi.status}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Recommendation */}
          <div className="mt-6 bg-primary/10 border border-primary/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Recommendation</h4>
                <p className="text-sm text-muted-foreground">{recommendation.text}</p>
              </div>
            </div>
            {recommendation.bestTool && (
              <div className="mt-4 flex gap-3">
                <button className="btn-primary text-sm">
                  {recommendation.action}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}