import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcutsOptions {
  onOpenCommandPalette: () => void;
  onAddTool: () => void;
  onExport: () => void;
  onShare: () => void;
  onToggleTheme: () => void;
  onShowShortcuts: () => void;
}

export function useKeyboardShortcuts({
  onOpenCommandPalette,
  onAddTool,
  onExport,
  onShare,
  onToggleTheme,
  onShowShortcuts,
}: KeyboardShortcutsOptions) {
  const navigate = useNavigate();
  const lastKeyRef = useRef<string | null>(null);
  const lastKeyTimeRef = useRef<number>(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                   target.tagName === 'TEXTAREA' || 
                   target.isContentEditable;

    // Command palette: ⌘K or Ctrl+K (always works)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      onOpenCommandPalette();
      return;
    }

    // Other shortcuts only work outside of inputs
    if (isInput) return;

    const now = Date.now();
    const key = e.key.toLowerCase();

    // Two-key navigation sequences (g + d/l/a)
    if (lastKeyRef.current === 'g' && now - lastKeyTimeRef.current < 500) {
      switch (key) {
        case 'd':
          e.preventDefault();
          navigate('/');
          break;
        case 'l':
          e.preventDefault();
          navigate('/library');
          break;
        case 'a':
          e.preventDefault();
          navigate('/analytics');
          break;
      }
      lastKeyRef.current = null;
      return;
    }

    // Single key shortcuts
    switch (key) {
      case 'g':
        // Start of navigation sequence
        lastKeyRef.current = 'g';
        lastKeyTimeRef.current = now;
        break;
      case 'n':
        e.preventDefault();
        onAddTool();
        break;
      case 'e':
        e.preventDefault();
        onExport();
        break;
      case 's':
        e.preventDefault();
        onShare();
        break;
      case 't':
        e.preventDefault();
        onToggleTheme();
        break;
      case '?':
        e.preventDefault();
        onShowShortcuts();
        break;
      default:
        lastKeyRef.current = null;
    }
  }, [navigate, onOpenCommandPalette, onAddTool, onExport, onShare, onToggleTheme, onShowShortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
