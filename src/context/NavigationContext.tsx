import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type Tab = 'overview' | 'analyze' | 'features' | 'cogs' | 'tiers' | 'pricing' | 'mockup';

export interface NavigationContextValue {
  activeTab: Tab;
  navigateTo: (tab: Tab) => void;
  previousTab: Tab | null;
  navigationHistory: Tab[];
}

// ============================================================================
// Context
// ============================================================================

const NavigationContext = createContext<NavigationContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [previousTab, setPreviousTab] = useState<Tab | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<Tab[]>(['overview']);

  const navigateTo = useCallback((tab: Tab) => {
    setActiveTab((current) => {
      setPreviousTab(current);
      setNavigationHistory((history) => [...history.slice(-9), tab]); // Keep last 10
      return tab;
    });
  }, []);

  const value: NavigationContextValue = {
    activeTab,
    navigateTo,
    previousTab,
    navigationHistory,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
