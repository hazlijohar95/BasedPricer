import { useState, useEffect, useCallback } from 'react';

// Default values (can be reset to these)
// More accurate breakdown: OCR separate from AI processing
export const DEFAULT_UNIT_COSTS = {
  extraction: 0.15,    // Document scan (Mistral Vision OCR) ~$0.03
  lineItem: 0.008,     // AI processing per item (DeepSeek reasoning) ~$0.002
  email: 0.005,        // Transactional email (Resend) ~$0.001
  storageGb: 0.07,     // Cloud storage (R2) ~$0.015/GB
} as const;

export const DEFAULT_FIXED_COSTS = {
  database: 111.75,      // $25 × 4.47
  compute: 223.50,       // $50 × 4.47
  currencyApi: 53.64,    // $12 × 4.47
  monitoring: 44.70,     // $10 × 4.47
  emailBase: 89.40,      // $20 × 4.47
  misc: 89.40,           // $20 × 4.47
} as const;

export const DEFAULT_EXCHANGE_RATE = 4.47;

export interface UnitCosts {
  extraction: number;
  lineItem: number;
  email: number;
  storageGb: number;
}

export interface FixedCosts {
  database: number;
  compute: number;
  currencyApi: number;
  monitoring: number;
  emailBase: number;
  misc: number;
}

export interface EditableCostsState {
  unitCosts: UnitCosts;
  fixedCosts: FixedCosts;
  exchangeRate: number;
}

const STORAGE_KEY = 'cynco-pricing-costs';

function loadFromStorage(): EditableCostsState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load costs from localStorage:', e);
  }
  return null;
}

function saveToStorage(state: EditableCostsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save costs to localStorage:', e);
  }
}

function getDefaultState(): EditableCostsState {
  return {
    unitCosts: { ...DEFAULT_UNIT_COSTS },
    fixedCosts: { ...DEFAULT_FIXED_COSTS },
    exchangeRate: DEFAULT_EXCHANGE_RATE,
  };
}

export function useEditableCosts() {
  const [state, setState] = useState<EditableCostsState>(() => {
    const stored = loadFromStorage();
    return stored || getDefaultState();
  });

  // Track which values have been edited
  const [editedFields, setEditedFields] = useState<Set<string>>(() => {
    const stored = loadFromStorage();
    if (!stored) return new Set();

    const edited = new Set<string>();
    const defaults = getDefaultState();

    // Check unit costs
    Object.keys(defaults.unitCosts).forEach(key => {
      if (stored.unitCosts[key as keyof UnitCosts] !== defaults.unitCosts[key as keyof UnitCosts]) {
        edited.add(`unit.${key}`);
      }
    });

    // Check fixed costs
    Object.keys(defaults.fixedCosts).forEach(key => {
      if (stored.fixedCosts[key as keyof FixedCosts] !== defaults.fixedCosts[key as keyof FixedCosts]) {
        edited.add(`fixed.${key}`);
      }
    });

    // Check exchange rate
    if (stored.exchangeRate !== defaults.exchangeRate) {
      edited.add('exchangeRate');
    }

    return edited;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const updateUnitCost = useCallback((key: keyof UnitCosts, value: number) => {
    setState(prev => ({
      ...prev,
      unitCosts: { ...prev.unitCosts, [key]: Math.max(0, value) },
    }));
    setEditedFields(prev => new Set(prev).add(`unit.${key}`));
  }, []);

  const updateFixedCost = useCallback((key: keyof FixedCosts, value: number) => {
    setState(prev => ({
      ...prev,
      fixedCosts: { ...prev.fixedCosts, [key]: Math.max(0, value) },
    }));
    setEditedFields(prev => new Set(prev).add(`fixed.${key}`));
  }, []);

  const updateExchangeRate = useCallback((value: number) => {
    setState(prev => ({
      ...prev,
      exchangeRate: Math.max(0.01, value),
    }));
    setEditedFields(prev => new Set(prev).add('exchangeRate'));
  }, []);

  const resetToDefaults = useCallback(() => {
    setState(getDefaultState());
    setEditedFields(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const resetUnitCosts = useCallback(() => {
    setState(prev => ({
      ...prev,
      unitCosts: { ...DEFAULT_UNIT_COSTS },
    }));
    setEditedFields(prev => {
      const next = new Set(prev);
      Object.keys(DEFAULT_UNIT_COSTS).forEach(key => next.delete(`unit.${key}`));
      return next;
    });
  }, []);

  const resetFixedCosts = useCallback(() => {
    setState(prev => ({
      ...prev,
      fixedCosts: { ...DEFAULT_FIXED_COSTS },
    }));
    setEditedFields(prev => {
      const next = new Set(prev);
      Object.keys(DEFAULT_FIXED_COSTS).forEach(key => next.delete(`fixed.${key}`));
      return next;
    });
  }, []);

  const isEdited = useCallback((field: string) => editedFields.has(field), [editedFields]);
  const hasAnyEdits = editedFields.size > 0;

  // Calculate total fixed costs
  const totalFixedCosts = Object.values(state.fixedCosts).reduce((a, b) => a + b, 0);

  return {
    unitCosts: state.unitCosts,
    fixedCosts: state.fixedCosts,
    exchangeRate: state.exchangeRate,
    totalFixedCosts,
    updateUnitCost,
    updateFixedCost,
    updateExchangeRate,
    resetToDefaults,
    resetUnitCosts,
    resetFixedCosts,
    isEdited,
    hasAnyEdits,
  };
}
