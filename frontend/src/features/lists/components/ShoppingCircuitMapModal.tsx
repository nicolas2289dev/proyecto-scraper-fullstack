import React from 'react';
import { X, MapPin, ExternalLink, Navigation } from 'lucide-react';
import type { TiendaOptima } from '../types/lists.types';
import { SupermarketBadge } from './SupermarketBadge';

interface ShoppingCircuitMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  hojaDeRuta: TiendaOptima[];
}

export const ShoppingCircuitMapModal: React.FC<ShoppingCircuitMapModalProps> = ({
  isOpen,
  onClose,
  hojaDeRuta,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="opt-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-modal-title"
    >
      <div className="opt-modal-card">
        {/* Cabecera del modal */}
        <div className="opt-modal-header">
          <div className="opt-modal-title-wrap">
            <div className="opt-modal-icon-badge">
              <Navigation size={20} />
            </div>
            <div>
              <h3 id="map-modal-title" className="opt-modal-title">
                Recorrido de Compra
              </h3>
              <p className="opt-modal-subtitle">
                {hojaDeRuta.length === 1
                  ? 'Parada única recomendada para tu compra'
                  : `Secuencia optimizada de ${hojaDeRuta.length} paradas`}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="opt-modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de paradas comerciales con enlace a Google Maps */}
        <div className="opt-modal-stops-list">
          {hojaDeRuta.map((store, index) => {
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${store.supermercadoNombre} supermercado`
            )}`;

            return (
              <div key={store.supermercadoId} className="opt-modal-stop-card">
                <div className="opt-modal-stop-num">
                  <span>{index + 1}</span>
                </div>

                <div className="opt-modal-stop-body">
                  <div className="opt-modal-stop-top">
                    <div className="opt-modal-stop-brand">
                      <SupermarketBadge name={store.supermercadoNombre} size={28} />
                      <span className="opt-modal-stop-name">{store.supermercadoNombre}</span>
                    </div>

                    <span className="opt-modal-stop-subtotal">
                      ${store.subtotalTienda.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <p className="opt-modal-stop-details">
                    {store.productos.length} producto(s) asignado(s) en esta sucursal
                  </p>

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opt-modal-stop-link"
                  >
                    <MapPin size={16} />
                    <span>Ver sucursal en Google Maps</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pie del modal */}
        <div className="opt-modal-footer">
          <button type="button" className="opt-modal-btn-done" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

