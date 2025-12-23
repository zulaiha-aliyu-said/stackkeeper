import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'L'], description: 'Go to Library' },
      { keys: ['G', 'A'], description: 'Go to Analytics' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['N'], description: 'Add new tool' },
      { keys: ['E'], description: 'Export to CSV' },
      { keys: ['S'], description: 'Share your stack' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    title: 'Settings',
    shortcuts: [
      { keys: ['T'], description: 'Toggle theme (dark/light)' },
    ],
  },
  {
    title: 'Dialogs',
    shortcuts: [
      { keys: ['Escape'], description: 'Close dialog/modal' },
    ],
  },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50"
                  >
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="min-w-[24px] h-6 flex items-center justify-center px-2 bg-background border border-border rounded text-xs font-mono text-muted-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border text-center text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-secondary rounded">?</kbd> anywhere to show this help
        </div>
      </DialogContent>
    </Dialog>
  );
}
