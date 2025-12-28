import { useState, useEffect } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Tool, CATEGORIES, PLATFORMS, Category, Platform } from '@/types/tool';
import { toast } from 'sonner';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tool: Omit<Tool, 'id' | 'addedDate' | 'lastUsed' | 'timesUsed'>) => void;
  editTool?: Tool | null;
  onUpdate?: (id: string, updates: Partial<Tool>) => void;
  existingTags?: string[];
}

export function AddToolModal({ isOpen, onClose, onAdd, editTool, onUpdate, existingTags = [] }: AddToolModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '' as Category | '',
    platform: '' as Platform | '',
    price: '',
    purchaseDate: '',
    login: '',
    password: '',
    redemptionCode: '',
    notes: '',
    tags: [] as string[],
    toolUrl: '',
  });

  useEffect(() => {
    if (editTool) {
      setFormData({
        name: editTool.name,
        category: editTool.category,
        platform: editTool.platform,
        price: editTool.price.toString(),
        purchaseDate: editTool.purchaseDate.split('T')[0],
        login: editTool.login || '',
        password: editTool.password || '',
        redemptionCode: editTool.redemptionCode || '',
        notes: editTool.notes || '',
        tags: editTool.tags || [],
        toolUrl: editTool.toolUrl || '',
      });
    } else {
      setFormData({
        name: '',
        category: '' as Category | '',
        platform: '' as Platform | '',
        price: '',
        purchaseDate: '',
        login: '',
        password: '',
        redemptionCode: '',
        notes: '',
        tags: [],
        toolUrl: '',
      });
    }
  }, [editTool, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

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
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          toolUrl: formData.toolUrl || undefined,
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
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          toolUrl: formData.toolUrl || undefined,
        });
        toast.success('Tool added to your vault!');
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedTags = existingTags.filter(
    tag => !formData.tags.includes(tag) && tag.toLowerCase().includes(newTag.toLowerCase())
  );

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

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Tool URL
                <span className="text-xs text-muted-foreground ml-2">(for extension tracking)</span>
              </label>
              <input
                type="url"
                value={formData.toolUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, toolUrl: e.target.value }))}
                placeholder="https://app.toolname.com"
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Custom Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a tag..."
                className="input-field flex-1"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn-secondary px-3"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {suggestedTags.length > 0 && newTag && (
              <div className="flex flex-wrap gap-1">
                {suggestedTags.slice(0, 5).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                      setNewTag('');
                    }}
                    className="text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-md transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}
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
