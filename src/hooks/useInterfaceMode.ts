import { useState, useCallback, useEffect } from 'react';
import {
  InterfaceMode,
  SIMPLE_MODE_FEATURES,
  POWER_MODE_FEATURES
} from '@/types/settings';

const STORAGE_KEY = 'stackvault_interface_mode';

export function useInterfaceMode() {
  const [mode, setModeState] = useState<InterfaceMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'simple' || saved === 'power') return saved;
    return 'simple';
  });

  const setMode = useCallback((newMode: InterfaceMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'simple' ? 'power' : 'simple');
  }, [mode, setMode]);

  const isSimpleMode = mode === 'simple';
  const isPowerMode = mode === 'power';
  const features = isSimpleMode ? SIMPLE_MODE_FEATURES : POWER_MODE_FEATURES;

  return {
    mode,
    setMode,
    toggleMode,
    isSimpleMode,
    isPowerMode,
    features,
  };
}
