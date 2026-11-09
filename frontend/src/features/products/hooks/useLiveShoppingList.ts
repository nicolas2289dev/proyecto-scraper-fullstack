import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth';
import { listaApi, type ListaCompraDetalle, type ItemLista } from '@/features/lists';

export const SHOPPING_LIST_UPDATED_EVENT = 'ahorraya:list-updated';

export function notifyShoppingListUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SHOPPING_LIST_UPDATED_EVENT));
  }
}

export function useLiveShoppingList() {
  const isAuthenticated = useAuthStore((state) => !!state.token);

  const [activeList, setActiveList] = useState<ListaCompraDetalle | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const fetchActiveList = useCallback(async (silent = false) => {
    if (!isAuthenticated) {
      setActiveList(null);
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const listas = await listaApi.getAll();
      if (listas && listas.length > 0) {
        const preferred = listas.find((l) => l.favorita) || listas[0];
        setActiveList(preferred);
      } else {
        setActiveList(null);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 401 && status !== 403) {
        console.error('Error al obtener la lista activa:', err);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchActiveList(false);
  }, [fetchActiveList]);

  useEffect(() => {
    const handleListUpdated = () => {
      fetchActiveList(true);
    };

    window.addEventListener(SHOPPING_LIST_UPDATED_EVENT, handleListUpdated);
    return () => {
      window.removeEventListener(SHOPPING_LIST_UPDATED_EVENT, handleListUpdated);
    };
  }, [fetchActiveList]);

  const recalculateListTotals = (
    list: ListaCompraDetalle,
    updatedItems: ItemLista[]
  ): ListaCompraDetalle => {
    const totalEstimado = updatedItems.reduce((acc, item) => {
      const subtotal = Number(
        item.precioTotal ?? (item.precioUnitario || 0) * (item.cantidad || 1)
      );
      return acc + subtotal;
    }, 0);

    return {
      ...list,
      items: updatedItems,
      totalEstimado,
    };
  };

  const updateItemQuantity = useCallback(
    async (item: ItemLista, nextQuantity: number) => {
      if (!activeList || nextQuantity < 1) return;

      const previousList = activeList;
      setUpdatingItemId(item.id);

      // Actualización optimista
      const optimisticItems = (activeList.items || []).map((it) => {
        if (it.id !== item.id) return it;
        const unitPrice = Number(it.precioUnitario || 0);
        return {
          ...it,
          cantidad: nextQuantity,
          precioTotal: unitPrice * nextQuantity,
        };
      });
      setActiveList(recalculateListTotals(activeList, optimisticItems));

      try {
        await listaApi.updateItem(activeList.id, item.id, item.productoId, nextQuantity);
        notifyShoppingListUpdated();
      } catch (err) {
        console.error('Error actualizando cantidad del ítem:', err);
        setActiveList(previousList);
      } finally {
        setUpdatingItemId(null);
      }
    },
    [activeList]
  );

  const incrementItem = useCallback(
    (item: ItemLista) => {
      return updateItemQuantity(item, (item.cantidad || 1) + 1);
    },
    [updateItemQuantity]
  );

  const decrementItem = useCallback(
    (item: ItemLista) => {
      if ((item.cantidad || 1) <= 1) return Promise.resolve();
      return updateItemQuantity(item, item.cantidad - 1);
    },
    [updateItemQuantity]
  );

  const removeItem = useCallback(
    async (item: ItemLista) => {
      if (!activeList) return;

      const previousList = activeList;
      setUpdatingItemId(item.id);

      // Actualización optimista
      const optimisticItems = (activeList.items || []).filter((it) => it.id !== item.id);
      setActiveList(recalculateListTotals(activeList, optimisticItems));

      try {
        await listaApi.removeItem(activeList.id, item.id);
        notifyShoppingListUpdated();
      } catch (err) {
        console.error('Error eliminando ítem de la lista:', err);
        setActiveList(previousList);
      } finally {
        setUpdatingItemId(null);
      }
    },
    [activeList]
  );

  const items = activeList?.items ?? [];
  const itemsCount = items.length;
  const totalUnitsCount = items.reduce((acc, it) => acc + (it.cantidad || 1), 0);
  const totalEstimado = Number(
    activeList?.totalEstimado ??
      items.reduce(
        (acc, it) =>
          acc + Number(it.precioTotal ?? (it.precioUnitario || 0) * (it.cantidad || 1)),
        0
      )
  );

  return {
    activeList,
    items,
    itemsCount,
    totalUnitsCount,
    totalEstimado,
    loading,
    updatingItemId,
    isDrawerOpen,
    setIsDrawerOpen,
    incrementItem,
    decrementItem,
    removeItem,
    refreshActiveList: () => fetchActiveList(true),
  };
}
