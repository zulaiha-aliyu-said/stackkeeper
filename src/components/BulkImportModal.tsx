import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle2, ClipboardPaste } from 'lucide-react';
import { Category, Platform, CATEGORIES, PLATFORMS } from '@/types/tool';
import { toast } from 'sonner';

interface ParsedTool {
  name: string;
  category: Category;
  platform: Platform;
  price: number;
  purchaseDate: string;
  notes?: string;
  valid: boolean;
  errors: string[];
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tool: any) => void;
}

const VALID_CATEGORIES = CATEGORIES.map(c => c.toLowerCase());
const VALID_PLATFORMS = PLATFORMS.map(p => p.toLowerCase());

function matchCategory(raw: string): Category | null {
  const lower = raw.trim().toLowerCase();
  const idx = VALID_CATEGORIES.indexOf(lower);
  if (idx >= 0) return CATEGORIES[idx];
  // Fuzzy: partial match
  const found = CATEGORIES.find(c => c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase()));
  return found || null;
}

function matchPlatform(raw: string): Platform | null {
  const lower = raw.trim().toLowerCase();
  const idx = VALID_PLATFORMS.indexOf(lower);
  if (idx >= 0) return PLATFORMS[idx];
  if (lower.includes('appsumo') || lower.includes('ltd')) return 'LTD';
  if (lower.includes('pitch')) return 'PitchGround';
  if (lower.includes('deal')) return 'DealFuel';
  if (lower.includes('stack')) return 'StackSocial';
  return null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseRow(fields: string[]): ParsedTool {
  const errors: string[] = [];
  const name = fields[0]?.trim() || '';
  if (!name) errors.push('Name is required');

  const category = matchCategory(fields[1] || '') || null;
  if (!category) errors.push(`Invalid category "${fields[1]?.trim() || ''}"`);

  const platform = matchPlatform(fields[2] || '') || 'Other';

  const priceRaw = (fields[3] || '').replace(/[$,]/g, '').trim();
  const price = parseFloat(priceRaw);
  if (isNaN(price) || price < 0) errors.push(`Invalid price "${fields[3]?.trim() || ''}"`);

  const dateRaw = fields[4]?.trim() || '';
  let purchaseDate = '';
  if (dateRaw) {
    const d = new Date(dateRaw);
    if (isNaN(d.getTime())) {
      errors.push(`Invalid date "${dateRaw}"`);
    } else {
      purchaseDate = d.toISOString();
    }
  } else {
    purchaseDate = new Date().toISOString();
  }

  const notes = fields[5]?.trim() || undefined;

  return {
    name,
    category: category || 'Other',
    platform,
    price: isNaN(price) ? 0 : price,
    purchaseDate,
    notes,
    valid: errors.length === 0,
    errors,
  };
}

function parseCSV(text: string): ParsedTool[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];

  // Check if first line is a header
  const firstFields = parseCSVLine(lines[0]);
  const isHeader = firstFields.some(f => /^(name|tool|category|platform|price|date|notes)/i.test(f.trim()));
  const dataLines = isHeader ? lines.slice(1) : lines;

  return dataLines.map(line => parseRow(parseCSVLine(line)));
}

const SAMPLE_CSV = `Name,Category,Platform,Price,Purchase Date,Notes
Writesonic,AI,LTD,59,2024-01-15,Content writing tool
Canva Pro,Design,Other,99,2024-03-01,
SEMrush,Marketing,PitchGround,149,2024-02-20,SEO tool`;

export function BulkImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const [mode, setMode] = useState<'paste' | 'file'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [parsed, setParsed] = useState<ParsedTool[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleParse = () => {
    if (!pasteText.trim()) {
      toast.error('Please paste or enter CSV data');
      return;
    }
    const results = parseCSV(pasteText);
    if (results.length === 0) {
      toast.error('No valid rows found');
      return;
    }
    setParsed(results);
    setStep('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setPasteText(text);
      const results = parseCSV(text);
      if (results.length === 0) {
        toast.error('No valid rows found in file');
        return;
      }
      setParsed(results);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validTools = parsed.filter(t => t.valid);
    if (validTools.length === 0) {
      toast.error('No valid tools to import');
      return;
    }
    setImporting(true);
    let count = 0;
    for (const tool of validTools) {
      try {
        onImport({
          name: tool.name,
          category: tool.category,
          platform: tool.platform,
          price: tool.price,
          purchaseDate: tool.purchaseDate,
          notes: tool.notes,
        });
        count++;
      } catch {
        // skip failed
      }
    }
    setImporting(false);
    toast.success(`Imported ${count} tool${count !== 1 ? 's' : ''} successfully!`);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setPasteText('');
    setParsed([]);
    setStep('input');
    setMode('paste');
  };

  const validCount = parsed.filter(t => t.valid).length;
  const invalidCount = parsed.filter(t => !t.valid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { handleReset(); onClose(); }} />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Bulk Import Tools</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {step === 'input' ? 'Paste CSV data or upload a file' : `${validCount} valid, ${invalidCount} invalid`}
            </p>
          </div>
          <button onClick={() => { handleReset(); onClose(); }} className="rounded-lg p-2 hover:bg-secondary transition-colors text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {step === 'input' ? (
            <>
              {/* Mode tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('paste')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'paste' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  <ClipboardPaste className="h-4 w-4" />
                  Paste CSV
                </button>
                <button
                  onClick={() => setMode('file')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'file' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  <FileText className="h-4 w-4" />
                  Upload File
                </button>
              </div>

              {mode === 'paste' ? (
                <div className="space-y-3">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={`Paste CSV data here...\n\nFormat: Name, Category, Platform, Price, Purchase Date, Notes\n\nExample:\nWritesonic,AI,LTD,59,2024-01-15,Content tool`}
                    className="input-field w-full h-48 resize-none font-mono text-sm"
                  />
                  <button
                    onClick={() => setPasteText(SAMPLE_CSV)}
                    className="text-xs text-primary hover:underline"
                  >
                    Load sample data
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload a <strong>.csv</strong> file</p>
                  <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                </div>
              )}

              {/* Expected format */}
              <div className="rounded-xl bg-secondary/50 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Expected CSV Format</p>
                <p className="text-xs text-muted-foreground font-mono">
                  Name, Category, Platform, Price, Purchase Date, Notes
                </p>
                <p className="text-xs text-muted-foreground">
                  Categories: {CATEGORIES.join(', ')} · Platforms: {PLATFORMS.join(', ')}
                </p>
              </div>

              {mode === 'paste' && (
                <button onClick={handleParse} className="btn-primary w-full">
                  Parse & Preview
                </button>
              )}
            </>
          ) : (
            <>
              {/* Preview table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Platform</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.map((tool, i) => (
                        <tr key={i} className={`border-t border-border ${!tool.valid ? 'bg-destructive/5' : ''}`}>
                          <td className="px-3 py-2">
                            {tool.valid ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <span title={tool.errors.join(', ')}>
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-foreground font-medium">{tool.name || '—'}</td>
                          <td className="px-3 py-2 text-muted-foreground">{tool.category}</td>
                          <td className="px-3 py-2 text-muted-foreground">{tool.platform}</td>
                          <td className="px-3 py-2 text-right text-foreground">${tool.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidCount > 0 && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{invalidCount} row{invalidCount !== 1 ? 's' : ''} have errors and will be skipped.</span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('input')} className="btn-secondary flex-1">
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : `Import ${validCount} Tool${validCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
