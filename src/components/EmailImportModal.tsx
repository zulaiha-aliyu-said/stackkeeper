import { useState } from 'react';
import { X, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { Tool, CATEGORIES, PLATFORMS, Category, Platform, getPlatformLabel } from '@/types/tool';
import { toast } from 'sonner';

interface ParsedToolData {
  name: string;
  price: string;
  purchaseDate: string;
  redemptionCode: string;
  platform: Platform | '';
  category: Category | '';
}

interface EmailImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Omit<Tool, 'id' | 'addedDate' | 'lastUsed' | 'timesUsed'>) => void;
}

export function EmailImportModal({ isOpen, onClose, onImport }: EmailImportModalProps) {
  const [emailText, setEmailText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedToolData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const parseEmail = () => {
    if (!emailText.trim()) {
      toast.error('Please paste your confirmation email');
      return;
    }

    const text = emailText;
    
    // Extract tool name patterns
    let name = '';
    const welcomeMatch = text.match(/welcome to\s+([^\n!.]+)/i);
    const purchasedMatch = text.match(/you purchased\s+([^\n!.]+)/i);
    const thankYouMatch = text.match(/thank you for (?:purchasing|buying)\s+([^\n!.]+)/i);
    const subjectMatch = text.match(/subject:\s*(?:your\s+)?([^\n]+?)(?:\s+purchase|\s+order|\s+confirmation|$)/i);
    const orderMatch = text.match(/order (?:for|of|:)\s+([^\n!.]+)/i);
    
    name = (welcomeMatch?.[1] || purchasedMatch?.[1] || thankYouMatch?.[1] || orderMatch?.[1] || subjectMatch?.[1] || '').trim();
    
    // Clean up common suffixes
    name = name.replace(/(?:lifetime deal|ltd|pitchground|lifetime|deal)$/i, '').trim();
    name = name.replace(/^(?:the|your)\s+/i, '').trim();

    // Extract price
    let price = '';
    const pricePatterns = [
      /\$(\d+(?:\.\d{2})?)/,
      /total[:\s]+\$?(\d+(?:\.\d{2})?)/i,
      /amount[:\s]+\$?(\d+(?:\.\d{2})?)/i,
      /price[:\s]+\$?(\d+(?:\.\d{2})?)/i,
      /paid[:\s]+\$?(\d+(?:\.\d{2})?)/i,
    ];
    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        price = match[1];
        break;
      }
    }

    // Extract redemption code
    let redemptionCode = '';
    const codePatterns = [
      /code[:\s]+([A-Z0-9]{5,}(?:-[A-Z0-9]+)*)/i,
      /license[:\s]+([A-Z0-9]{5,}(?:-[A-Z0-9]+)*)/i,
      /key[:\s]+([A-Z0-9]{5,}(?:-[A-Z0-9]+)*)/i,
      /([A-Z0-9]{4,5}-[A-Z0-9]{4,5}(?:-[A-Z0-9]{4,5})*)/,
    ];
    for (const pattern of codePatterns) {
      const match = text.match(pattern);
      if (match) {
        redemptionCode = match[1];
        break;
      }
    }

    // Extract date
    let purchaseDate = '';
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(\w+ \d{1,2},? \d{4})/,
      /(\d{4}-\d{2}-\d{2})/,
    ];
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const date = new Date(match[1]);
          if (!isNaN(date.getTime())) {
            purchaseDate = date.toISOString().split('T')[0];
            break;
          }
        } catch {
          // Continue trying
        }
      }
    }
    
    // Default to today if no date found
    if (!purchaseDate) {
      purchaseDate = new Date().toISOString().split('T')[0];
    }

    // Detect platform
    let platform: Platform | '' = '';
    if (/ltd/i.test(text)) platform = 'LTD';
    else if (/pitchground/i.test(text)) platform = 'PitchGround';
    else if (/dealfuel/i.test(text)) platform = 'DealFuel';
    else if (/stacksocial/i.test(text)) platform = 'StackSocial';

    // Auto-detect category based on keywords
    let category: Category | '' = '';
    const lowerText = text.toLowerCase();
    if (/email|newsletter|mailchimp|convertkit/i.test(lowerText)) category = 'Email';
    else if (/marketing|seo|social|ads|advertising/i.test(lowerText)) category = 'Marketing';
    else if (/design|graphic|figma|canva|photo|image/i.test(lowerText)) category = 'Design';
    else if (/ai|artificial|gpt|chatbot|machine learning/i.test(lowerText)) category = 'AI';
    else if (/video|youtube|editing|screen|loom/i.test(lowerText)) category = 'Video';
    else if (/dev|code|api|developer|programming/i.test(lowerText)) category = 'Dev Tools';
    else if (/analytics|data|dashboard|tracking|metrics/i.test(lowerText)) category = 'Analytics';
    else if (/productivity|project|task|notion|management/i.test(lowerText)) category = 'Productivity';

    const parsed: ParsedToolData = {
      name,
      price,
      purchaseDate,
      redemptionCode,
      platform,
      category,
    };

    setParsedData(parsed);
    setIsEditing(true);
    
    if (name || price || redemptionCode) {
      toast.success('Email parsed! Review and confirm the data.');
    } else {
      toast.warning('Could not extract much data. Please fill in manually.');
    }
  };

  const handleImport = () => {
    if (!parsedData) return;
    
    if (!parsedData.name || !parsedData.category || !parsedData.platform || !parsedData.price || !parsedData.purchaseDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    onImport({
      name: parsedData.name,
      category: parsedData.category as Category,
      platform: parsedData.platform as Platform,
      price: parseFloat(parsedData.price),
      purchaseDate: new Date(parsedData.purchaseDate).toISOString(),
      redemptionCode: parsedData.redemptionCode || undefined,
    });

    toast.success('Tool imported successfully!');
    handleClose();
  };

  const handleClose = () => {
    setEmailText('');
    setParsedData(null);
    setIsEditing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl animate-scale-in m-4">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Import from Email</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!isEditing ? (
            <>
              <div className="bg-secondary/50 border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">How it works:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Paste your marketplace confirmation email below</li>
                      <li>We'll extract tool name, price, date, and redemption code</li>
                      <li>Review and confirm the extracted data</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Paste your confirmation email:
                </label>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  placeholder="Paste the full email content here including headers..."
                  rows={12}
                  className="input-field w-full resize-none font-mono text-sm"
                />
              </div>

              <button
                onClick={parseEmail}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Parse & Extract Data
              </button>
            </>
          ) : (
            <>
              <div className="bg-success/10 border border-success/30 rounded-xl p-4">
                <p className="text-sm text-success font-medium">
                  ✓ Data extracted! Review and edit as needed.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Tool Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={parsedData?.name || ''}
                    onChange={(e) => setParsedData(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={parsedData?.category || ''}
                    onChange={(e) => setParsedData(prev => prev ? { ...prev, category: e.target.value as Category } : null)}
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
                    value={parsedData?.platform || ''}
                    onChange={(e) => setParsedData(prev => prev ? { ...prev, platform: e.target.value as Platform } : null)}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select platform</option>
                    {PLATFORMS.map(plat => (
                  <option key={plat} value={plat}>{getPlatformLabel(plat)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Price Paid <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    value={parsedData?.price || ''}
                    onChange={(e) => setParsedData(prev => prev ? { ...prev, price: e.target.value } : null)}
                    className="input-field w-full"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Purchase Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={parsedData?.purchaseDate || ''}
                    onChange={(e) => setParsedData(prev => prev ? { ...prev, purchaseDate: e.target.value } : null)}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Redemption Code</label>
                  <input
                    type="text"
                    value={parsedData?.redemptionCode || ''}
                    onChange={(e) => setParsedData(prev => prev ? { ...prev, redemptionCode: e.target.value } : null)}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  className="btn-primary flex-1"
                >
                  Import Tool
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}