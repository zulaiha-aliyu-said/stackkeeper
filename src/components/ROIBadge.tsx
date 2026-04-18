import { Tool } from '@/types/tool';
import { calculateROI, getROIStatusColor, getROIBgColor } from '@/lib/roi';

interface ROIBadgeProps {
  tool: Tool;
  showLabel?: boolean;
}

export function ROIBadge({ tool, showLabel = false }: ROIBadgeProps) {
  const roi = calculateROI(tool);

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getROIBgColor(roi.status)} ${getROIStatusColor(roi.status)}`}
      title={`Cost per use: ${roi.costPerUse !== null ? `$${roi.costPerUse.toFixed(2)}` : 'N/A'}`}
    >
      <span>{roi.statusEmoji}</span>
      {showLabel && <span>{roi.costPerUse !== null ? `$${roi.costPerUse.toFixed(2)}/use` : 'No usage'}</span>}
    </span>
  );
}
