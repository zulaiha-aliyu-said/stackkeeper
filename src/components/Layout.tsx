import { ReactNode, useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Library, BarChart3, Vault, Command, Chrome, Clock, Network, Swords, Settings, CreditCard, LogOut, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CommandPalette } from '@/components/CommandPalette';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { AddToolModal } from '@/components/AddToolModal';
import { ToolDetailModal } from '@/components/ToolDetailModal';
import { ShareStackModal } from '@/components/ShareStackModal';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { useTools } from '@/hooks/useTools';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useBranding } from '@/hooks/useBranding';
import { useTier } from '@/hooks/useTier';
import { useInterfaceMode } from '@/hooks/useInterfaceMode';
import { useSocialSettings } from '@/hooks/useSocialSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Tool } from '@/types/tool';
import { toast } from 'sonner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { tools, addTool, updateTool, deleteTool, markAsUsed, exportToCSV, totalInvestment, stackScore, getAllTags } = useTools();
  const { theme, toggleTheme } = useTheme();
  const { branding, canCustomizeBranding } = useBranding();
  const { isAgency } = useTier();
  const { isSimpleMode } = useInterfaceMode();
  const { enableBattles } = useSocialSettings();
  const { user, logout } = useAuth();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // All available nav links
  const allNavLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, mode: 'all' as const },
    { path: '/library', label: 'Tool Library', icon: Library, mode: 'all' as const },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, mode: 'power' as const },
    { path: '/insights', label: 'Insights', icon: Clock, mode: 'power' as const },
    { path: '/network', label: 'Network', icon: Network, mode: 'power' as const },
    { path: '/battles', label: 'Battles', icon: Swords, mode: 'power' as const, requiresSocial: true },
    { path: '/extension', label: 'Extension', icon: Chrome, mode: 'power' as const },
    { path: '/pricing', label: 'Pricing', icon: CreditCard, mode: 'all' as const },
    { path: '/settings', label: 'Settings', icon: Settings, mode: 'all' as const },
  ];

  // Filter nav links based on mode and social settings
  const navLinks = useMemo(() => {
    return allNavLinks.filter(link => {
      // Check mode
      if (isSimpleMode && link.mode === 'power') return false;
      // Check social settings for Battles
      if (link.requiresSocial && !enableBattles) return false;
      return true;
    });
  }, [isSimpleMode, enableBattles]);

  // Determine logo and name based on branding
  const showCustomBranding = isAgency && canCustomizeBranding;
  const displayName = showCustomBranding && branding.appName ? branding.appName : 'StackVault';
  const displayLogo = showCustomBranding && branding.logo ? branding.logo : null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors overflow-hidden">
                {displayLogo ? (
                  <img src={displayLogo} alt="Logo" className="h-5 w-5 object-contain" />
                ) : (
                  <Vault className="h-5 w-5 text-primary" />
                )}
              </div>
              <span className="text-xl font-bold text-foreground">{displayName}</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={location.pathname === path ? 'nav-link-active' : 'nav-link'}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </span>
                </Link>
              ))}
            </div>

            {/* Desktop right actions */}
            <div className="flex items-center gap-2">
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
              <div className="hidden sm:flex items-center gap-2">
                <ModeSwitcher />
                <ThemeToggle />
                {user && (
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 h-9 px-3 rounded-lg bg-secondary hover:bg-destructive/10 hover:text-destructive transition-colors text-sm text-muted-foreground"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
            <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}

              {/* Mobile-only actions */}
              <div className="border-t border-border pt-3 mt-3 flex items-center gap-2 px-4">
                <ModeSwitcher />
                <ThemeToggle />
                {user && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 h-9 px-3 rounded-lg bg-secondary hover:bg-destructive/10 hover:text-destructive transition-colors text-sm text-muted-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
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
