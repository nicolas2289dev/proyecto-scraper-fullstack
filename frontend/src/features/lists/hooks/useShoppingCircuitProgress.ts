import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TiendaOptima } from '../types/lists.types';

export interface StoreProgress {
  total: number;
  checked: number;
  percentage: number;
  completed: boolean;
}

export interface CircuitProgress {
  totalItems: number;
  checkedItemsCount: number;
  percentage: number;
  isAllCompleted: boolean;
}

export const buildCircuitItemKey = (supermercadoId: number, productoId: number): string => {
  return `${supermercadoId}_${productoId}`;
};

export function useShoppingCircuitProgress(listaId: number, hojaDeRuta: TiendaOptima[] = []) {
  const storageKey = `shopping_circuit_checked_${listaId}`;

  // 1. Cargar estado inicial persistido en sessionStorage
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(() => {
    try {
      if (typeof window === 'undefined') return new Set();
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch (e) {
      console.warn('Error reading circuit progress from sessionStorage:', e);
    }
    return new Set<string>();
  });

  // 2. Parada activa en el Stepper (índice 0 a hojaDeRuta.length - 1)
  const [activeStep, setActiveStep] = useState<number>(0);

  // 3. Paneles colapsables por supermercadoId
  const [expandedStores, setExpandedStores] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    if (hojaDeRuta.length > 0) {
      // Por defecto la primera tienda inicia abierta
      initial[hojaDeRuta[0].supermercadoId] = true;
    }
    return initial;
  });

  // 4. Guardar en sessionStorage ante cambios de checkedKeys
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(storageKey, JSON.stringify(Array.from(checkedKeys)));
      }
    } catch (e) {
      console.warn('Error persisting circuit progress to sessionStorage:', e);
    }
  }, [checkedKeys, storageKey]);

  // 5. Alternar estado de un ítem
  const toggleItem = useCallback((supermercadoId: number, productoId: number) => {
    const key = buildCircuitItemKey(supermercadoId, productoId);
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const isItemChecked = useCallback(
    (supermercadoId: number, productoId: number): boolean => {
      return checkedKeys.has(buildCircuitItemKey(supermercadoId, productoId));
    },
    [checkedKeys]
  );

  // 6. Alternar panel colapsable
  const toggleStoreExpanded = useCallback((supermercadoId: number) => {
    setExpandedStores((prev) => ({
      ...prev,
      [supermercadoId]: !prev[supermercadoId],
    }));
  }, []);

  const setStoreExpanded = useCallback((supermercadoId: number, expanded: boolean) => {
    setExpandedStores((prev) => ({
      ...prev,
      [supermercadoId]: expanded,
    }));
  }, []);

  // 7. Calcular métricas por tienda
  const getStoreProgress = useCallback(
    (supermercadoId: number): StoreProgress => {
      const store = hojaDeRuta.find((s) => s.supermercadoId === supermercadoId);
      if (!store || store.productos.length === 0) {
        return { total: 0, checked: 0, percentage: 0, completed: false };
      }
      const total = store.productos.length;
      let checked = 0;
      for (const p of store.productos) {
        if (checkedKeys.has(buildCircuitItemKey(supermercadoId, p.productoId))) {
          checked++;
        }
      }
      const percentage = Math.round((checked / total) * 100);
      return {
        total,
        checked,
        percentage,
        completed: checked === total,
      };
    },
    [hojaDeRuta, checkedKeys]
  );

  // 8. Calcular progreso global
  const progress = useMemo<CircuitProgress>(() => {
    let totalItems = 0;
    let checkedItemsCount = 0;

    for (const store of hojaDeRuta) {
      totalItems += store.productos.length;
      for (const p of store.productos) {
        if (checkedKeys.has(buildCircuitItemKey(store.supermercadoId, p.productoId))) {
          checkedItemsCount++;
        }
      }
    }

    const percentage = totalItems > 0 ? Math.round((checkedItemsCount / totalItems) * 100) : 0;
    return {
      totalItems,
      checkedItemsCount,
      percentage,
      isAllCompleted: totalItems > 0 && checkedItemsCount === totalItems,
    };
  }, [hojaDeRuta, checkedKeys]);

  // 9. Reiniciar progreso
  const resetProgress = useCallback(() => {
    setCheckedKeys(new Set());
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(storageKey);
      }
    } catch (e) {
      console.warn('Error clearing circuit progress:', e);
    }
  }, [storageKey]);

  return {
    checkedKeys,
    activeStep,
    setActiveStep,
    expandedStores,
    toggleItem,
    isItemChecked,
    toggleStoreExpanded,
    setStoreExpanded,
    getStoreProgress,
    progress,
    resetProgress,
  };
}
