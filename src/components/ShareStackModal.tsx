import { useState, useRef } from 'react';
import { X, Download, Share2, Twitter, Linkedin, Copy, Check, Package, DollarSign, TrendingUp } from 'lucide-react';
import { Tool } from '@/types/tool';
import { toast } from 'sonner';

interface ShareStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: Tool[];
  totalInvestment: number;
  stackScore: number;
}

export function ShareStackModal({ isOpen, onClose, tools, totalInvestment, stackScore }: ShareStackModalProps) {
  const [showToolNames, setShowToolNames] = useState(true);
  const [showSpend, setShowSpend] = useState(true);
  const [showScore, setShowScore] = useState(true);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Get top 5 most used tools
  const topTools = [...tools]
    .sort((a, b) => b.timesUsed - a.timesUsed)
    .slice(0, 5)
    .filter(t => t.timesUsed > 0);

  const getStackScoreEmoji = () => {
    if (stackScore >= 70) return '🏆';
    if (stackScore >= 50) return '✅';
    if (stackScore >= 30) return '⚠️';
    return '🚨';
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      // Dynamic import to avoid bundle bloat
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = 'my-saas-stack.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Image downloaded!');
    } catch (error) {
      toast.error('Failed to generate image. Try copying the link instead.');
    }
  };

  const getTweetText = () => {
    let text = `My ${showSpend ? `$${totalInvestment.toLocaleString()}` : ''} SaaS stack: ${tools.length} lifetime deals tracked`;
    if (showScore) {
      text += `, ${stackScore}% actually being used ${stackScore >= 50 ? '🔥' : '😅'}`;
    }
    text += '\n\nOrganized with StackVault - finally stopped forgetting what I bought!\n\n#LTD #SaaS #StackVault';
    return encodeURIComponent(text);
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${getTweetText()}`, '_blank');
  };

  const handleLinkedInShare = () => {
    const text = `Check out my SaaS stack: ${tools.length} tools tracked with StackVault!`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&summary=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl animate-scale-in m-4">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Share2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Share Your Stack</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preview Card */}
          <div 
            ref={cardRef}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-background to-secondary/30 border border-border p-6"
          >
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            
            <div className="relative space-y-6">
              <h3 className="text-2xl font-bold text-foreground text-center">
                MY {showSpend && `$${totalInvestment.toLocaleString()}`} SAAS STACK
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground">
                    <Package className="h-5 w-5 text-primary" />
                    {tools.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Tools</p>
                </div>
                
                {showSpend && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground">
                      <DollarSign className="h-5 w-5 text-success" />
                      {totalInvestment.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Invested</p>
                  </div>
                )}
                
                {showScore && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {stackScore}%
                    </div>
                    <p className="text-xs text-muted-foreground">{getStackScoreEmoji()} Score</p>
                  </div>
                )}
              </div>

              {showToolNames && topTools.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground text-center">Top Tools:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {topTools.map(tool => (
                      <span 
                        key={tool.id}
                        className="text-xs px-2 py-1 bg-secondary/50 rounded-full text-foreground"
                      >
                        {tool.name} ({tool.timesUsed} uses)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Built with StackVault
              </p>
            </div>
          </div>

          {/* Customize Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Customize:</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showToolNames}
                  onChange={(e) => setShowToolNames(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Show tool names</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSpend}
                  onChange={(e) => setShowSpend(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Show spend amount</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showScore}
                  onChange={(e) => setShowScore(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Show Stack Score</span>
              </label>
            </div>
          </div>

          {/* Share Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Image
            </button>
            <button
              onClick={handleCopyLink}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleTwitterShare}
              className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white py-2 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Twitter className="h-4 w-4" />
              Share on Twitter
            </button>
            <button
              onClick={handleLinkedInShare}
              className="flex-1 bg-[#0A66C2] hover:bg-[#094d92] text-white py-2 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}