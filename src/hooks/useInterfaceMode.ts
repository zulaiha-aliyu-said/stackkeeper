import { useState, useEffect, useCallback } from 'react';
import { 
  InterfaceMode, 
  SIMPLE_MODE_FEATURES, 
  POWER_MODE_FEATURES 
} from '@/types/settings';

const STORAGE_KEY = 'stackvault_interface_mode';

export function useInterfaceMode() {
  const [mode, setModeState] = useState<InterfaceMode>('simple');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'simple' || stored === 'power') {
      setModeState(stored);
    }
  }, []);

  const setMode = useCallback((newMode: InterfaceMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'simple' ? 'power' : 'simple';
    setMode(newMode);
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
