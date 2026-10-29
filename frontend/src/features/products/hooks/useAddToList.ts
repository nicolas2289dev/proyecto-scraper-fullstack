import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth';
import { listaApi, type ListaCompra } from '@/features/lists';
import type { ProductoBusqueda } from '../types/products.types';

export interface AlertModalState {
  visible: boolean;
  title: string;
  message: string;
  severity: 'warning' | 'info' | 'error';
}

export function useAddToList(filterSupermarket?: number | 'all') {
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'clasica' | 'compacta'>('compacta');
  const [selectedProduct, setSelectedProduct] = useState<ProductoBusqueda | null>(null);
  const [selectedListId, setSelectedListId] = useState<number | string>('');
  const [selectedSupermarketId, setSelectedSupermarketId] = useState<number | string>('');
  const [quantity, setQuantity] = useState(1);
  const [listOptions, setListOptions] = useState<ListaCompra[]>([]);
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [alertModal, setAlertModal] = useState<AlertModalState>({
    visible: false,
    title: '',
    message: '',
    severity: 'warning',
  });

  const showAlert = useCallback(
    (title: string, message: string, severity: 'warning' | 'info' | 'error' = 'warning') => {
      setAlertModal({ visible: true, title, message, severity });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setAlertModal((prev) => ({ ...prev, visible: false }));
  }, []);

  // Cargar listas del usuario si está autenticado
  const fetchLists = useCallback(async () => {
    if (!isAuthenticated) {
      setListOptions([]);
      return;
    }
    try {
      const lists = await listaApi.getAll();
      setListOptions(lists);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 401 && status !== 403) {
        console.error('Error cargando listas de compras:', err);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const openAddModal = useCallback(
    (
      product: ProductoBusqueda,
      preselectedSuperId?: number,
      viewMode: 'clasica' | 'compacta' = 'compacta'
    ) => {
      if (!isAuthenticated) {
        openAuthModal('login');
        return;
      }

      setSelectedProduct(product);
      setQuantity(1);
      setSuccessMsg(null);

      if (viewMode === 'clasica' && preselectedSuperId) {
        setModalMode('clasica');
        setSelectedSupermarketId(preselectedSuperId);
      } else {
        setModalMode('compacta');
        const activeSuperId =
          filterSupermarket && filterSupermarket !== 'all' ? Number(filterSupermarket) : null;
        const matchedStore =
          activeSuperId && product.tiendas?.find((t) => t.supermercadoId === activeSuperId);
        const firstSuperId = matchedStore
          ? matchedStore.supermercadoId
          : product.tiendas && product.tiendas.length > 0
          ? product.tiendas[0].supermercadoId
          : 1;
        setSelectedSupermarketId(firstSuperId);
      }

      setSelectedListId(listOptions.length ? listOptions[0].id : '');
      setShowModal(true);
    },
    [isAuthenticated, openAuthModal, filterSupermarket, listOptions]
  );

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleAddToList = useCallback(async () => {
    if (!selectedProduct || selectedListId === '') return;
    setAdding(true);
    setSuccessMsg(null);
    try {
      const superId =
        typeof selectedSupermarketId === 'number'
          ? selectedSupermarketId
          : Number(selectedSupermarketId) || undefined;

      await listaApi.addItem(
        Number(selectedListId),
        selectedProduct.id,
        quantity,
        superId
      );

      const targetList = listOptions.find((l) => l.id === Number(selectedListId));
      setSuccessMsg(
        `¡Agregaste ${quantity} unidad(es) a "${targetList?.nombreLista || 'tu lista'}"!`
      );
      setTimeout(() => setShowModal(false), 1200);
    } catch (err: unknown) {
      console.error('Error agregando producto:', err);
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosErr?.response?.status;
      const message =
        axiosErr?.response?.data?.message || 'Error al agregar producto a la lista';

      if (status === 409) {
        showAlert('Atención', message, 'warning');
      } else {
        showAlert('Error', message, 'error');
      }
    } finally {
      setAdding(false);
    }
  }, [selectedProduct, selectedListId, selectedSupermarketId, quantity, listOptions, showAlert]);

  return {
    showModal,
    modalMode,
    selectedProduct,
    selectedListId,
    setSelectedListId,
    selectedSupermarketId,
    setSelectedSupermarketId,
    quantity,
    setQuantity,
    listOptions,
    adding,
    successMsg,
    alertModal,
    openAddModal,
    closeModal,
    handleAddToList,
    showAlert,
    hideAlert,
    refreshLists: fetchLists,
  };
}
