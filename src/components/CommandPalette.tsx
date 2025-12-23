import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Search, 
  LayoutDashboard, 
  Library, 
  BarChart3, 
  Plus, 
  Download, 
  Share2,
  Moon,
  Sun,
  Settings,
  Keyboard
} from 'lucide-react';
import { Tool } from '@/types/tool';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tools: Tool[];
  onAddTool: () => void;
  onExport: () => void;
  onShare: () => void;
  onViewTool: (tool: Tool) => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  onShowShortcuts: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'actions' | 'tools' | 'settings';
  keywords?: string[];
}

export function CommandPalette({
  isOpen,
  onClose,
  tools,
  onAddTool,
  onExport,
  onShare,
  onViewTool,
  onToggleTheme,
  theme,
  onShowShortcuts,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const commands: CommandItem[] = useMemo(() => {
    const baseCommands: CommandItem[] = [
      // Navigation
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'View your command center',
        icon: <LayoutDashboard className="h-4 w-4" />,
        action: () => { navigate('/'); onClose(); },
        category: 'navigation',
        keywords: ['home', 'main', 'overview'],
      },
      {
        id: 'nav-library',
        label: 'Go to Library',
        description: 'Browse all tools',
        icon: <Library className="h-4 w-4" />,
        action: () => { navigate('/library'); onClose(); },
        category: 'navigation',
        keywords: ['tools', 'browse', 'collection'],
      },
      {
        id: 'nav-analytics',
        label: 'Go to Analytics',
        description: 'View insights and charts',
        icon: <BarChart3 className="h-4 w-4" />,
        action: () => { navigate('/analytics'); onClose(); },
        category: 'navigation',
        keywords: ['stats', 'charts', 'insights', 'roi'],
      },
      // Actions
      {
        id: 'action-add',
        label: 'Add New Tool',
        description: 'Add a tool to your vault',
        icon: <Plus className="h-4 w-4" />,
        action: () => { onAddTool(); onClose(); },
        category: 'actions',
        keywords: ['create', 'new', 'add'],
      },
      {
        id: 'action-export',
        label: 'Export to CSV',
        description: 'Download your tool data',
        icon: <Download className="h-4 w-4" />,
        action: () => { onExport(); onClose(); },
        category: 'actions',
        keywords: ['download', 'csv', 'backup'],
      },
      {
        id: 'action-share',
        label: 'Share Your Stack',
        description: 'Generate shareable card',
        icon: <Share2 className="h-4 w-4" />,
        action: () => { onShare(); onClose(); },
        category: 'actions',
        keywords: ['social', 'twitter', 'share'],
      },
      // Settings
      {
        id: 'settings-theme',
        label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        description: 'Toggle color theme',
        icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        action: () => { onToggleTheme(); onClose(); },
        category: 'settings',
        keywords: ['theme', 'dark', 'light', 'mode'],
      },
      {
        id: 'settings-shortcuts',
        label: 'Keyboard Shortcuts',
        description: 'View all shortcuts',
        icon: <Keyboard className="h-4 w-4" />,
        action: () => { onShowShortcuts(); onClose(); },
        category: 'settings',
        keywords: ['keys', 'hotkeys', 'help'],
      },
    ];

    // Add tools as searchable items
    const toolCommands: CommandItem[] = tools.map(tool => ({
      id: `tool-${tool.id}`,
      label: tool.name,
      description: `${tool.category} • $${tool.price}`,
      icon: <Library className="h-4 w-4" />,
      action: () => { onViewTool(tool); onClose(); },
      category: 'tools' as const,
      keywords: [tool.category.toLowerCase(), tool.platform.toLowerCase(), ...(tool.tags || [])],
    }));

    return [...baseCommands, ...toolCommands];
  }, [tools, theme, navigate, onClose, onAddTool, onExport, onShare, onViewTool, onToggleTheme, onShowShortcuts]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands.filter(c => c.category !== 'tools');

    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => {
      const matchLabel = cmd.label.toLowerCase().includes(lowerQuery);
      const matchDesc = cmd.description?.toLowerCase().includes(lowerQuery);
      const matchKeywords = cmd.keywords?.some(k => k.includes(lowerQuery));
      return matchLabel || matchDesc || matchKeywords;
    });
  }, [commands, query]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    tools: 'Tools',
    settings: 'Settings',
  };

  let flatIndex = -1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden bg-card border-border">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tools, commands, or type to filter..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="mb-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[category]}
                </div>
                {items.map((cmd) => {
                  flatIndex++;
                  const isSelected = flatIndex === selectedIndex;
                  const currentIndex = flatIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <span className={isSelected ? 'text-primary' : 'text-muted-foreground'}>
                        {cmd.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">↵</kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">K</kbd>
            Toggle
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
