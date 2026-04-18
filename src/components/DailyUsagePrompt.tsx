import { useState, useEffect } from 'react';
import { CalendarCheck, X, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tool } from '@/types/tool';
import { toast } from 'sonner';

const LAST_PROMPT_KEY = 'stackvault_last_daily_prompt';

interface DailyUsagePromptProps {
  tools: Tool[];
  onMarkAsUsed: (toolIds: string[]) => void;
}

export function DailyUsagePrompt({ tools, onMarkAsUsed }: DailyUsagePromptProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());

  // Check if we should show the prompt
  useEffect(() => {
    const lastPrompt = localStorage.getItem(LAST_PROMPT_KEY);
    const today = new Date().toDateString();
    
    // Show prompt if it's a new day and we have tools
    if (lastPrompt !== today && tools.length > 0) {
      // Check time - only show after 6 PM to capture daily usage
      const hour = new Date().getHours();
      if (hour >= 18) {
        const timer = setTimeout(() => setIsOpen(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [tools.length]);

  const handleSubmit = () => {
    if (selectedTools.size > 0) {
      onMarkAsUsed(Array.from(selectedTools));
      toast.success(`Logged usage for ${selectedTools.size} tool${selectedTools.size > 1 ? 's' : ''}`);
    }
    localStorage.setItem(LAST_PROMPT_KEY, new Date().toDateString());
    setIsOpen(false);
    setSelectedTools(new Set());
  };

  const handleSkip = () => {
    localStorage.setItem(LAST_PROMPT_KEY, new Date().toDateString());
    setIsOpen(false);
    setSelectedTools(new Set());
  };

  const handleRemindLater = () => {
    setIsOpen(false);
    setSelectedTools(new Set());
  };

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedTools(new Set(tools.map(t => t.id)));
  };

  const clearAll = () => {
    setSelectedTools(new Set());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarCheck className="h-5 w-5 text-primary" />
            </div>
            Daily Usage Check-in
          </DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground">
          Which tools did you use today? Select them below to track your usage.
        </p>

        {/* Quick actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear
          </Button>
        </div>

        {/* Tool list */}
        <div className="flex-1 overflow-y-auto space-y-2 py-4">
          {tools.map(tool => (
            <label
              key={tool.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedTools.has(tool.id)
                  ? 'bg-primary/10 border border-primary'
                  : 'bg-secondary hover:bg-secondary/80 border border-transparent'
              }`}
            >
              <Checkbox
                checked={selectedTools.has(tool.id)}
                onCheckedChange={() => toggleTool(tool.id)}
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">{tool.name}</p>
                <p className="text-sm text-muted-foreground">{tool.category}</p>
              </div>
              {tool.lastUsed && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Used {tool.timesUsed}x
                </span>
              )}
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-border">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleRemindLater}>
              Remind Later
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip Today
            </Button>
          </div>
          <Button onClick={handleSubmit} disabled={selectedTools.size === 0}>
            Log {selectedTools.size > 0 ? selectedTools.size : ''} Tool{selectedTools.size !== 1 ? 's' : ''} as Used
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Manual trigger button for the prompt
export function DailyPromptTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="gap-2">
      <CalendarCheck className="h-4 w-4" />
      Daily Check-in
    </Button>
  );
}
