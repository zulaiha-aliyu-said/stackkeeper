import { useState } from 'react';
import { X } from 'lucide-react';
import { Tool, CATEGORIES, PLATFORMS, Category, Platform } from '@/types/tool';
import { toast } from 'sonner';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tool: Omit<Tool, 'id' | 'addedDate' | 'lastUsed' | 'timesUsed'>) => void;
  editTool?: Tool | null;
  onUpdate?: (id: string, updates: Partial<Tool>) => void;
}

export function AddToolModal({ isOpen, onClose, onAdd, editTool, onUpdate }: AddToolModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: editTool?.name || '',
    category: editTool?.category || '' as Category | '',
    platform: editTool?.platform || '' as Platform | '',
    price: editTool?.price?.toString() || '',
    purchaseDate: editTool?.purchaseDate?.split('T')[0] || '',
    login: editTool?.login || '',
    password: editTool?.password || '',
    redemptionCode: editTool?.redemptionCode || '',
    notes: editTool?.notes || '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.platform || !formData.price || !formData.purchaseDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editTool && onUpdate) {
        onUpdate(editTool.id, {
          name: formData.name,
          category: formData.category as Category,
          platform: formData.platform as Platform,
          price: parseFloat(formData.price),
          purchaseDate: new Date(formData.purchaseDate).toISOString(),
          login: formData.login || undefined,
          password: formData.password || undefined,
          redemptionCode: formData.redemptionCode || undefined,
          notes: formData.notes || undefined,
        });
        toast.success('Tool updated successfully!');
      } else {
        onAdd({
          name: formData.name,
          category: formData.category as Category,
          platform: formData.platform as Platform,
          price: parseFloat(formData.price),
          purchaseDate: new Date(formData.purchaseDate).toISOString(),
          login: formData.login || undefined,
          password: formData.password || undefined,
          redemptionCode: formData.redemptionCode || undefined,
          notes: formData.notes || undefined,
        });
        toast.success('Tool added to your vault!');
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl animate-scale-in m-4">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {editTool ? 'Edit Tool' : 'Add New Tool'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Tool Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Notion, Figma"
                className="input-field w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Category <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
                className="input-field w-full"
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Platform <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value as Platform }))}
                className="input-field w-full"
                required
              >
                <option value="">Select platform</option>
                {PLATFORMS.map(plat => (
                  <option key={plat} value={plat}>{plat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Price Paid <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="49.00"
                min="0"
                step="0.01"
                className="input-field w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Purchase Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                className="input-field w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Login/Email</label>
              <input
                type="text"
                value={formData.login}
                onChange={(e) => setFormData(prev => ({ ...prev, login: e.target.value }))}
                placeholder="your@email.com"
                className="input-field w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="input-field w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Redemption Code</label>
              <input
                type="text"
                value={formData.redemptionCode}
                onChange={(e) => setFormData(prev => ({ ...prev, redemptionCode: e.target.value }))}
                placeholder="License key or code"
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about this tool..."
              rows={3}
              className="input-field w-full resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1"
            >
              {isSubmitting ? 'Saving...' : editTool ? 'Update Tool' : 'Add Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
