import { Tool } from '@/types/tool';
import { differenceInDays } from 'date-fns';

export type ROIStatus = 'excellent' | 'good' | 'fair' | 'poor';

export interface ROIMetrics {
  costPerUse: number | null;
  daysOwned: number;
  avgUsesPerMonth: number;
  status: ROIStatus;
  statusEmoji: string;
  statusLabel: string;
}

// Alias for backward compatibility
export type ROIData = ROIMetrics;

export function calculateROI(tool: Tool): ROIMetrics {
  const daysOwned = differenceInDays(new Date(), new Date(tool.purchaseDate));
  
  const costPerUse = tool.timesUsed > 0 
    ? Math.round((tool.price / tool.timesUsed) * 100) / 100
    : null;
  
  const avgUsesPerMonth = daysOwned > 0 
    ? Math.round((tool.timesUsed / daysOwned) * 30 * 10) / 10
    : 0;

  let status: ROIStatus;
  let statusEmoji: string;
  let statusLabel: string;

  if (costPerUse === null || tool.timesUsed === 0) {
    status = 'poor';
    statusEmoji = '🚨';
    statusLabel = 'Never Used';
  } else if (costPerUse < 1) {
    status = 'excellent';
    statusEmoji = '🏆';
    statusLabel = 'Excellent ROI';
  } else if (costPerUse <= 5) {
    status = 'good';
    statusEmoji = '✅';
    statusLabel = 'Good ROI';
  } else if (costPerUse <= 10) {
    status = 'fair';
    statusEmoji = '⚠️';
    statusLabel = 'Fair ROI';
  } else {
    status = 'poor';
    statusEmoji = '🚨';
    statusLabel = 'Poor ROI';
  }

  return {
    costPerUse,
    daysOwned,
    avgUsesPerMonth,
    status,
    statusEmoji,
    statusLabel,
  };
}

export function getROIStatusColor(status: ROIStatus): string {
  switch (status) {
    case 'excellent':
      return 'text-success';
    case 'good':
      return 'text-success';
    case 'fair':
      return 'text-warning';
    case 'poor':
      return 'text-destructive';
  }
}

export function getROIBgColor(status: ROIStatus): string {
  switch (status) {
    case 'excellent':
      return 'bg-success/20';
    case 'good':
      return 'bg-success/10';
    case 'fair':
      return 'bg-warning/20';
    case 'poor':
      return 'bg-destructive/20';
  }
}
