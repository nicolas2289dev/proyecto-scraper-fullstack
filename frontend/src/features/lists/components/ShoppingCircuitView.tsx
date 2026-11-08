import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import type { OptimizacionCompra, ItemLista } from '../types/lists.types';
import { useShoppingCircuitProgress } from '../hooks/useShoppingCircuitProgress';
import { OptimizationHeroBanner } from './OptimizationHeroBanner';
import { ShoppingCircuitTopStepper } from './ShoppingCircuitTopStepper';
import { ShoppingCircuitHeroBanner } from './ShoppingCircuitHeroBanner';
import { ShoppingCircuitChecklist } from './ShoppingCircuitChecklist';
import { ShoppingCircuitSummary } from './ShoppingCircuitSummary';
import { ShoppingCircuitTipsCard } from './ShoppingCircuitTipsCard';
import { ShoppingCircuitMapModal } from './ShoppingCircuitMapModal';

interface ShoppingCircuitViewProps {
  listaId: number;
  optimizationResult: OptimizacionCompra;
  listItems?: ItemLista[];
  onBack?: () => void;
}

export const ShoppingCircuitView: React.FC<ShoppingCircuitViewProps> = ({
  listaId,
  optimizationResult,
  listItems,
  onBack,
}) => {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(`/mis-listas/${listaId}`));

  const {
    hojaDeRuta,
    totalOptimo,
    totalMasCaro,
    totalAhorrado,
    productosSinPrecio,
    nombreLista,
  } = optimizationResult;

  const {
    toggleItem,
    isItemChecked,
    progress,
  } = useShoppingCircuitProgress(listaId, hojaDeRuta);

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const nombresTiendas = useMemo(() => {
    return hojaDeRuta.map((s) => s.supermercadoNombre).join(', ');
  }, [hojaDeRuta]);

  const supermercadoPrincipal = hojaDeRuta[0]?.supermercadoNombre || 'Supermercado';

  return (
    <section
      className="opt-circuit-section"
      aria-label="Circuito y optimización de compra interactiva"
    >
      {/* Hero Banner de Optimización con ahorro máximo */}
      <OptimizationHeroBanner
        nombreLista={nombreLista}
        totalAhorrado={totalAhorrado}
        onBack={handleBack}
      />

      {/* 1. Stepper Superior estilo tracker de proceso */}
      <ShoppingCircuitTopStepper
        totalProductos={progress.totalItems}
        nombresTiendas={nombresTiendas}
        paradasCount={hojaDeRuta.length}
        isAllCompleted={progress.isAllCompleted}
      />

      {/* 2. Cuadrícula Principal de 2 Columnas (Layout Idéntico a Diseño Adjunto) */}
      <div className="opt-circuit-grid">
        {/* Columna Izquierda: Banner de parada + Lista de compras con checklist + Tip */}
        <div className="opt-circuit-left-column">
          {/* Banner de Parada Única / Paradas Recomendadas */}
          <ShoppingCircuitHeroBanner
            paradasCount={hojaDeRuta.length}
            supermercadoPrincipal={supermercadoPrincipal}
            onOpenMapModal={() => setIsMapModalOpen(true)}
          />

          {/* Lista de compras con checkboxes táctiles, miniaturas y badges */}
          <ShoppingCircuitChecklist
            hojaDeRuta={hojaDeRuta}
            listItems={listItems}
            totalAhorrado={totalAhorrado}
            isItemChecked={isItemChecked}
            toggleItem={toggleItem}
            progress={progress}
          />

          {/* Aviso opcional si existen productos no encontrados */}
          {productosSinPrecio && productosSinPrecio.length > 0 && (
            <div className="opt-missing-alert">
              <AlertCircle size={18} className="opt-missing-alert-icon" />
              <div>
                <strong>Aviso:</strong> {productosSinPrecio.length} producto(s) no contaban
                con precio registrado:{' '}
                <span className="opt-missing-names">
                  {productosSinPrecio.map((p) => p.productoNombre).join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Resumen de compra + Consejos */}
        <div className="opt-circuit-right-column">
          {/* Card: Resumen de tu compra con desglose por supermercado y acceso a recorrido */}
          <ShoppingCircuitSummary
            totalItems={progress.totalItems}
            totalOptimo={totalOptimo}
            totalAhorrado={totalAhorrado}
            totalMasCaro={totalMasCaro}
            hojaDeRuta={hojaDeRuta}
            onOpenMapModal={() => setIsMapModalOpen(true)}
          />

          {/* Card 3: Consejos para ahorrar */}
          <ShoppingCircuitTipsCard />
        </div>
      </div>

      {/* Modal interactivo de recorrido en mapa */}
      <ShoppingCircuitMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        hojaDeRuta={hojaDeRuta}
      />
    </section>
  );
};
