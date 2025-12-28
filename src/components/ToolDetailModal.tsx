import { useState } from 'react';
import { X, Copy, Check, Edit2, Trash2, Zap, Eye, EyeOff, Calendar, DollarSign, Tag, ExternalLink, Globe } from 'lucide-react';
import { Tool } from '@/types/tool';
import { format, differenceInDays, addDays } from 'date-fns';
import { toast } from 'sonner';
import { ROISection } from './ROISection';
interface ToolDetailModalProps {
  tool: Tool;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsUsed: (id: string) => void;
  onEdit: (tool: Tool) => void;
  onDelete: (id: string) => void;
}

export function ToolDetailModal({ 
  tool, 
  isOpen, 
  onClose, 
  onMarkAsUsed,
  onEdit,
  onDelete 
}: ToolDetailModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const refundDeadline = addDays(new Date(tool.purchaseDate), 60);
  const daysUntilRefund = differenceInDays(refundDeadline, new Date());
  const isRefundActive = daysUntilRefund > 0;

  const handleDelete = () => {
    onDelete(tool.id);
    toast.success('Tool deleted from vault');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl animate-scale-in m-4">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{tool.name}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="badge-category">{tool.category}</span>
            <span className="badge-platform">{tool.platform}</span>
            <span className={tool.lastUsed ? 'badge-used' : 'badge-unused'}>
              {tool.timesUsed > 0 ? `Used ${tool.timesUsed}x` : 'Never used'}
            </span>
          </div>

          {/* Tags */}
          {tool.tags && tool.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tool.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 text-primary text-sm rounded-full"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Refund Alert */}
          {isRefundActive && daysUntilRefund <= 10 && (
            <div className="alert-warning">
              <p className="font-semibold text-warning">
                ⏰ {daysUntilRefund} days left to request refund
              </p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Price Paid</span>
              </div>
              <p className="text-xl font-bold text-foreground">${tool.price}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Purchased</span>
              </div>
              <p className="font-medium text-foreground">
                {format(new Date(tool.purchaseDate), 'MMM d, yyyy')}
              </p>
            </div>
            {tool.lastUsed && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm">Last Used</span>
                </div>
                <p className="font-medium text-foreground">
                  {format(new Date(tool.lastUsed), 'MMM d, yyyy')}
                </p>
              </div>
            )}
            {isRefundActive && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Refund Expires</span>
                </div>
                <p className="font-medium text-foreground">
                  {format(refundDeadline, 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>

          {/* Tool URL */}
          {tool.toolUrl && (
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
              <Globe className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Tool URL (tracked by extension)</p>
                <p className="font-mono text-sm text-foreground truncate">{tool.toolUrl}</p>
              </div>
              <a
                href={tool.toolUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-background transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <button
                onClick={() => copyToClipboard(tool.toolUrl!, 'URL')}
                className="p-2 rounded-lg hover:bg-background transition-colors"
              >
                {copiedField === 'URL' ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          )}

          {/* ROI Section */}
          <ROISection tool={tool} />

          {/* Credentials Section */}
          {(tool.login || tool.password || tool.redemptionCode) && (
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground">Credentials</h3>
              
              {tool.login && (
                <div className="flex items-center justify-between bg-secondary rounded-lg p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Login/Email</p>
                    <p className="font-mono text-foreground">{tool.login}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(tool.login!, 'Login')}
                    className="p-2 rounded-lg hover:bg-background transition-colors"
                  >
                    {copiedField === 'Login' ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              )}

              {tool.password && (
                <div className="flex items-center justify-between bg-secondary rounded-lg p-3">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Password</p>
                    <p className="font-mono text-foreground">
                      {showPassword ? tool.password : '••••••••••••'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 rounded-lg hover:bg-background transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(tool.password!, 'Password')}
                      className="p-2 rounded-lg hover:bg-background transition-colors"
                    >
                      {copiedField === 'Password' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {tool.redemptionCode && (
                <div className="flex items-center justify-between bg-secondary rounded-lg p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Redemption Code</p>
                    <p className="font-mono text-foreground">{tool.redemptionCode}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(tool.redemptionCode!, 'Code')}
                    className="p-2 rounded-lg hover:bg-background transition-colors"
                  >
                    {copiedField === 'Code' ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {tool.notes && (
            <div className="space-y-2 pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground">Notes</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{tool.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <button
              onClick={() => onMarkAsUsed(tool.id)}
              className="btn-primary flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Mark as Used
            </button>
            <button
              onClick={() => {
                onEdit(tool);
                onClose();
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Delete?</span>
                <button
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-ghost text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-ghost text-destructive flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
