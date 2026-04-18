import { Tool } from '../types/tool';

export function generateInsights(tools: Tool[]): string[] {
  if (!tools || tools.length === 0) {
    return ["You need to add tools to get financial insights."];
  }

  const insights: string[] = [];
  const now = new Date();

  // 1. Identify unused tools
  const unusedTools = tools.filter(t => {
    if (!t.lastUsed) return true;
    const daysSinceUsed = (now.getTime() - new Date(t.lastUsed).getTime()) / (1000 * 3600 * 24);
    return daysSinceUsed >= 30;
  });
  const wastedMonthlyUnused = unusedTools.reduce((acc, t) => acc + Number(t.price || 0), 0);

  if (unusedTools.length > 0) {
    insights.push(`You are wasting $${wastedMonthlyUnused.toFixed(2)}/month on unused tools`);
    const topUnused = [...unusedTools].sort((a, b) => Number(b.price) - Number(a.price))[0];
    if (topUnused && topUnused.price > 0) {
      insights.push(`Consider removing ${topUnused.name} - unused for 30+ days`);
    }
  }

  // 2. Identify low-usage tools (e.g. bought > 30 days ago, used < 3 times)
  const lowUsageTools = tools.filter(t => {
    if (!t.purchaseDate) return false;
    const daysSincePurchase = (now.getTime() - new Date(t.purchaseDate).getTime()) / (1000 * 3600 * 24);
    return daysSincePurchase > 30 && t.timesUsed > 0 && t.timesUsed < 3;
  });

  if (lowUsageTools.length > 0) {
    const worstROI = [...lowUsageTools].sort((a, b) => Number(b.price) - Number(a.price))[0];
    if (worstROI) {
      insights.push(`Consider removing ${worstROI.name} - low usage detected`);
    }
  }

  // 3. Identify most used/highest value tools
  const usedTools = tools.filter(t => t.timesUsed > 0);
  if (usedTools.length > 0) {
    const topUsed = [...usedTools].sort((a, b) => b.timesUsed - a.timesUsed)[0];
    insights.push(`${topUsed.name} is your highest value tool`);
  }

  // 4. Overall health
  if (unusedTools.length === 0 && lowUsageTools.length === 0 && tools.length > 0) {
    insights.push(`You are actively using all your tools efficiently`);
  }

  if (insights.length === 0) {
    insights.push("Your stack is currently well-balanced");
  }

  return insights;
}
