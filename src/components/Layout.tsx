import { ReactNode, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Library, BarChart3, Vault, Command, Chrome } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CommandPalette } from '@/components/CommandPalette';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { AddToolModal } from '@/components/AddToolModal';
import { ToolDetailModal } from '@/components/ToolDetailModal';
import { ShareStackModal } from '@/components/ShareStackModal';
import { useTools } from '@/hooks/useTools';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Tool } from '@/types/tool';
import { toast } from 'sonner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { tools, addTool, updateTool, deleteTool, markAsUsed, exportToCSV, totalInvestment, stackScore, getAllTags } = useTools();
  const { theme, toggleTheme } = useTheme();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [editTool, setEditTool] = useState<Tool | null>(null);

  const handleExport = useCallback(() => {
    if (tools.length === 0) {
      toast.error('No tools to export');
      return;
    }
    exportToCSV();
    toast.success('Tools exported to CSV');
  }, [tools.length, exportToCSV]);

  useKeyboardShortcuts({
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onAddTool: () => setIsAddModalOpen(true),
    onExport: handleExport,
    onShare: () => setIsShareModalOpen(true),
    onToggleTheme: toggleTheme,
    onShowShortcuts: () => setIsShortcutsOpen(true),
  });

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/library', label: 'Tool Library', icon: Library },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/extension', label: 'Extension', icon: Chrome },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Vault className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">StackVault</span>
            </Link>

            <div className="flex items-center gap-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={location.pathname === path ? 'nav-link-active' : 'nav-link'}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Command Palette Button */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm text-muted-foreground"
              >
                <Command className="h-4 w-4" />
                <span className="hidden md:inline">Search...</span>
                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
                  ⌘K
                </kbd>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tools={tools}
        onAddTool={() => setIsAddModalOpen(true)}
        onExport={handleExport}
        onShare={() => setIsShareModalOpen(true)}
        onViewTool={(tool) => setSelectedTool(tool)}
        onToggleTheme={toggleTheme}
        theme={theme}
        onShowShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Global Add Tool Modal */}
      <AddToolModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditTool(null);
        }}
        onAdd={addTool}
        editTool={editTool}
        onUpdate={updateTool}
        existingTags={getAllTags}
      />

      {/* Global Tool Detail Modal */}
      {selectedTool && (
        <ToolDetailModal
          tool={selectedTool}
          isOpen={!!selectedTool}
          onClose={() => setSelectedTool(null)}
          onMarkAsUsed={markAsUsed}
          onEdit={(tool) => {
            setEditTool(tool);
            setIsAddModalOpen(true);
            setSelectedTool(null);
          }}
          onDelete={(id) => {
            deleteTool(id);
            setSelectedTool(null);
          }}
        />
      )}

      {/* Global Share Modal */}
      <ShareStackModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tools={tools}
        totalInvestment={totalInvestment}
        stackScore={stackScore}
      />
    </div>
  );
}
