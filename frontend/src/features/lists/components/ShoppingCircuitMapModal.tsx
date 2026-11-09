import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  MapPin,
  ExternalLink,
  Navigation,
  Car,
  Footprints,
  LocateFixed,
  Search,
  Clock,
  Route,
  Sparkles,
} from 'lucide-react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type {
  AddressSuggestion,
  GeoCoordinates,
  RouteStop,
  TiendaOptima,
  TransportMode,
} from '../types/lists.types';
import { searchAddressNominatim, type RouteLegInfo } from '../utils/geoUtils';
import { getSupermarketLogo } from '@/features/products';
import { SupermarketBadge } from './SupermarketBadge';

export interface ShoppingCircuitMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  hojaDeRuta: TiendaOptima[];
  userLocation: GeoCoordinates;
  locationSource: 'gps' | 'manual' | 'default';
  locationLabel: string;
  gpsLoading: boolean;
  gpsError: string | null;
  transportMode: TransportMode;
  onChangeTransportMode: (mode: TransportMode) => void;
  orderedStops: RouteStop[];
  polyline: [number, number][];
  legs?: RouteLegInfo[];
  totalDistanceKm: number;
  totalDurationMin: number;
  googleMapsUrl: string;
  onRequestLiveGps: () => void;
  onSelectManualOrigin: (coords: GeoCoordinates, label?: string) => void;
}

/**
 * Ajusta automáticamente el encuadre del mapa para abarcar al usuario y todas las sucursales sugeridas
 */
const MapBoundsController: React.FC<{
  userLocation: GeoCoordinates;
  orderedStops: RouteStop[];
}> = ({ userLocation, orderedStops }) => {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      [userLocation.lat, userLocation.lng],
      ...orderedStops.map(
        (s): [number, number] => [s.sucursal.latitud, s.sucursal.longitud]
      ),
    ];

    const timer = window.setTimeout(() => {
      map.invalidateSize();
      if (points.length > 1) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [46, 46], maxZoom: 16 });
      } else {
        map.setView([userLocation.lat, userLocation.lng], 15);
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [map, userLocation, orderedStops]);

  return null;
};

/**
 * Permite al usuario tocar cualquier punto del mapa para fijar manualmente su punto de partida
 */
const MapClickOriginSelector: React.FC<{
  onSelectOrigin: (coords: GeoCoordinates, label?: string) => void;
}> = ({ onSelectOrigin }) => {
  useMapEvents({
    click(e) {
      onSelectOrigin(
        { lat: e.latlng.lat, lng: e.latlng.lng },
        `Punto elegido en mapa (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`
      );
    },
  });
  return null;
};

function createUserMarkerIcon(transportMode: TransportMode): L.DivIcon {
  const iconSvg =
    transportMode === 'driving'
      ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.2 1 12 1 13v3c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>`
      : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>`;

  return L.divIcon({
    className: 'opt-leaflet-custom-icon',
    html: `
      <div class="opt-map-user-pin">
        <div class="opt-map-user-pulse-ring"></div>
        <div class="opt-map-user-avatar">
          ${iconSvg}
        </div>
        <div class="opt-map-pin-tip opt-map-pin-tip--user"></div>
      </div>
    `,
    iconSize: [34, 40],
    iconAnchor: [17, 39],
  });
}

function createStopMarkerIcon(orden: number, brandName: string): L.DivIcon {
  const meta = getSupermarketLogo(brandName);
  const shortBrand = brandName.split(' ')[0];

  const logoContent = meta?.logoUrl
    ? `<img src="${meta.logoUrl}" alt="${shortBrand}" class="opt-map-stop-logo-img" />`
    : `<span class="opt-map-stop-fallback-text">${shortBrand.charAt(0)}</span>`;

  return L.divIcon({
    className: 'opt-leaflet-custom-icon',
    html: `
      <div class="opt-map-stop-pin">
        <div class="opt-map-stop-head">
          <div class="opt-map-stop-order-tag">${orden}</div>
          <div class="opt-map-stop-logo-circle">
            ${logoContent}
          </div>
        </div>
        <div class="opt-map-pin-tip opt-map-pin-tip--stop"></div>
      </div>
    `,
    iconSize: [46, 50],
    iconAnchor: [23, 46],
  });
}

export const ShoppingCircuitMapModal: React.FC<ShoppingCircuitMapModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  locationSource,
  locationLabel,
  gpsLoading,
  gpsError,
  transportMode,
  onChangeTransportMode,
  orderedStops,
  polyline,
  legs = [],
  totalDistanceKm,
  totalDurationMin,
  googleMapsUrl,
  onRequestLiveGps,
  onSelectManualOrigin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);

  const userIcon = useMemo(() => createUserMarkerIcon(transportMode), [transportMode]);

  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setSearchingAddress(true);
      searchAddressNominatim(searchQuery).then((res) => {
        if (active) {
          setSuggestions(res);
          setSearchingAddress(false);
        }
      });
    }, 380);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectSuggestion = (s: AddressSuggestion) => {
    onSelectManualOrigin({ lat: s.lat, lng: s.lng }, s.shortName);
    setSearchQuery('');
    setSuggestions([]);
  };

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
      <div className="opt-modal-card opt-modal-card--map-xl">
        {/* Cabecera del modal */}
        <div className="opt-modal-header">
          <div className="opt-modal-title-wrap">
            <div className="opt-modal-icon-badge">
              <Navigation size={20} />
            </div>
            <div>
              <h3 id="map-modal-title" className="opt-modal-title">
                Circuito de Compra en Tiempo Real
              </h3>
              <p className="opt-modal-subtitle">
                {orderedStops.length === 1
                  ? `Sucursal más cercana detectada: ${orderedStops[0].sucursal.nombreSucursal}`
                  : `Secuencia óptima por cercanía (${orderedStops.length} paradas): ${orderedStops
                      .map((s) => `${s.orden}° ${s.tienda.supermercadoNombre}`)
                      .join(' → ')}`}
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

        {/* Barra de controles: Buscador de partida + GPS + Selector de Transporte */}
        <div className="opt-map-controls-bar">
          {/* Buscador de dirección o calle */}
          <div className="opt-map-search-box">
            <Search size={15} className="opt-map-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val.trim().length < 3) {
                  setSuggestions([]);
                }
              }}
              placeholder="Buscar calle o punto de partida (ej: Belgrano 500, Jujuy)..."
              className="opt-map-search-input"
              aria-label="Buscar dirección de partida"
            />
            {searchingAddress && <span className="opt-map-search-Hint">Buscando...</span>}

            {suggestions.length > 0 && (
              <ul className="opt-map-suggestions-list" role="listbox">
                {suggestions.map((item, idx) => (
                  <li key={`${item.lat}-${item.lng}-${idx}`}>
                    <button
                      type="button"
                      className="opt-map-suggestion-btn"
                      onClick={() => handleSelectSuggestion(item)}
                    >
                      <MapPin size={14} className="opt-map-suggestion-pin" />
                      <span>{item.shortName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Botón GPS en vivo */}
          <button
            type="button"
            className={`opt-map-gps-btn ${locationSource === 'gps' ? 'is-active' : ''}`}
            onClick={onRequestLiveGps}
            disabled={gpsLoading}
            title="Usar mi ubicación GPS en tiempo real"
          >
            <LocateFixed size={15} />
            <span>{gpsLoading ? 'Ubicando...' : 'Mi GPS'}</span>
          </button>

          {/* Selector de modo de transporte: En auto vs A pie */}
          <div className="opt-map-transport-toggle" role="group" aria-label="Modo de transporte">
            <button
              type="button"
              className={`opt-map-mode-btn ${transportMode === 'walking' ? 'is-active' : ''}`}
              onClick={() => onChangeTransportMode('walking')}
            >
              <Footprints size={15} />
              <span>A pie</span>
            </button>
            
            <button
              type="button"
              className={`opt-map-mode-btn ${transportMode === 'driving' ? 'is-active' : ''}`}
              onClick={() => onChangeTransportMode('driving')}
            >
              <Car size={15} />
              <span>En auto</span>
            </button>
          </div>
        </div>

        {/* Layout en 2 columnas: Mapa ampliado (izq) y Métricas + Paradas (der) */}
        <div className="opt-map-modal-split-container">
          {/* Columna Izquierda: Mapa Interactivo con tema claro y mayor altura vertical */}
          <div className="opt-map-main-column">
            <div className="opt-map-canvas-wrapper">
              <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={14}
                scrollWheelZoom={true}
                className="opt-leaflet-map-container"
              >
                {/* TEMA CLARO: OpenStreetMap libre y sin API keys */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapBoundsController userLocation={userLocation} orderedStops={orderedStops} />
                <MapClickOriginSelector onSelectOrigin={onSelectManualOrigin} />

                {/* Polilíneas diferenciadas por tramo con colores distintos para evitar confusión */}
                {legs && legs.length > 0 ? (
                  legs.map((leg) => (
                    <React.Fragment key={`leg-polyline-${leg.legIndex}`}>
                      <Polyline
                        positions={leg.polyline}
                        pathOptions={{
                          color: '#0f172a',
                          weight: 6,
                          opacity: 0.35,
                        }}
                      />
                      <Polyline
                        positions={leg.polyline}
                        pathOptions={{
                          color: leg.color,
                          weight: 4.5,
                          opacity: 0.95,
                          dashArray: transportMode === 'walking' ? '6 8' : undefined,
                        }}
                      />
                    </React.Fragment>
                  ))
                ) : polyline.length > 1 ? (
                  <>
                    <Polyline
                      positions={polyline}
                      pathOptions={{
                        color: '#022c22',
                        weight: 6,
                        opacity: 0.3,
                      }}
                    />
                    <Polyline
                      positions={polyline}
                      pathOptions={{
                        color: '#059669',
                        weight: 4,
                        opacity: 0.95,
                        dashArray: transportMode === 'walking' ? '6 8' : undefined,
                      }}
                    />
                  </>
                ) : null}

                {/* Marcador del Usuario (estático, sin popup al hacer clic) */}
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={userIcon}
                  interactive={false}
                />

                {/* Marcadores de las sucursales sugeridas (estáticos, sin popup al hacer clic) */}
                {orderedStops.map((stop) => (
                  <Marker
                    key={`${stop.sucursal.id}-${stop.orden}`}
                    position={[stop.sucursal.latitud, stop.sucursal.longitud]}
                    icon={createStopMarkerIcon(stop.orden, stop.tienda.supermercadoNombre)}
                    interactive={false}
                  />
                ))}
              </MapContainer>

              {/* Leyenda flotante de tramos */}
              {legs && legs.length > 1 && (
                <div className="opt-map-legs-floating-legend">
                  {legs.map((leg) => (
                    <span key={`legend-${leg.legIndex}`} className="opt-map-legend-chip">
                      <span
                        className="opt-map-legend-dot"
                        style={{ backgroundColor: leg.color }}
                      />
                      <span>
                        <strong>Tramo {leg.legIndex}:</strong> {leg.fromName} → {leg.toName}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              <span className="opt-map-canvas-hint">
                💡 Haz clic en cualquier punto del mapa para mover tu punto de partida
              </span>
            </div>
          </div>

          {/* Columna Derecha: Estado de ubicación actual + Métricas + Paradas ordenadas */}
          <div className="opt-map-sidebar-column">
            {/* Estado de ubicación actual y métricas globales del recorrido */}
            <div className="opt-map-status-strip opt-map-status-strip--sidebar">
              <div className="opt-map-origin-badge">
                <span
                  className={`opt-map-origin-dot ${
                    locationSource === 'gps' ? 'opt-map-origin-dot--gps' : ''
                  }`}
                />
                <div className="opt-map-origin-info">
                  <span className="opt-map-origin-label">Punto de partida</span>
                  <span className="opt-map-origin-text">{locationLabel}</span>
                </div>
              </div>

              <div className="opt-map-metrics-pills">
                <span className="opt-map-metric-pill">
                  <Route size={14} />
                  <strong>{totalDistanceKm} km</strong> totales
                </span>
                <span className="opt-map-metric-pill">
                  <Clock size={14} />
                  <strong>{totalDurationMin} min</strong> (
                  {transportMode === 'walking' ? 'a pie' : 'en auto'})
                </span>
              </div>
            </div>

            {gpsError && (
              <div className="opt-map-gps-notice" role="status">
                <span>{gpsError}</span>
              </div>
            )}

            {/* Lista de paradas ordenadas por cercanía colocada al costado del mapa */}
            <div className="opt-modal-stops-list opt-modal-stops-list--sidebar">
              <div className="opt-modal-stops-header">
                <h4 className="opt-modal-stops-title">Recorrido sugerido</h4>
                <span className="opt-modal-stops-count">
                  {orderedStops.length} {orderedStops.length === 1 ? 'parada' : 'paradas'}
                </span>
              </div>

              {orderedStops.map((stop) => {
                const singleBranchMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${stop.sucursal.nombreSucursal} ${stop.sucursal.direccion} ${stop.sucursal.ciudad}`
                )}`;

                return (
                  <div key={stop.tienda.supermercadoId} className="opt-modal-stop-card">
                    <div className="opt-modal-stop-num">
                      <span>{stop.orden}</span>
                    </div>

                    <div className="opt-modal-stop-body">
                      <div className="opt-modal-stop-top">
                        <div className="opt-modal-stop-brand">
                          <SupermarketBadge name={stop.tienda.supermercadoNombre} size={28} />
                          <div>
                            <span className="opt-modal-stop-name">
                              {stop.sucursal.nombreSucursal}
                            </span>
                            <span className="opt-modal-stop-address">
                              {stop.sucursal.direccion}, {stop.sucursal.ciudad}
                            </span>
                          </div>
                        </div>

                        <span className="opt-modal-stop-subtotal">
                          ${stop.tienda.subtotalTienda.toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="opt-modal-stop-meta-row">
                        <span className="opt-modal-stop-proximity-tag">
                          <Sparkles size={12} />
                          {stop.orden === 1
                            ? `Sucursal más cercana a vos (${stop.distanciaDesdeAnteriorKm} km)`
                            : `A ${stop.distanciaDesdeAnteriorKm} km de la Parada ${stop.orden - 1}`}
                        </span>
                        <span className="opt-modal-stop-details">
                          {stop.tienda.productos.length} producto(s) asignado(s)
                        </span>
                      </div>

                      <a
                        href={singleBranchMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opt-modal-stop-link"
                      >
                        <MapPin size={15} />
                        <span>Ver esta sucursal en Google Maps</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pie del modal con botón para abrir la ruta guiada completa */}
        <div className="opt-modal-footer opt-modal-footer--split">
          <button type="button" className="opt-modal-btn-secondary" onClick={onClose}>
            Cerrar
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="opt-modal-btn-done opt-modal-btn-gmaps-route"
          >
            <Navigation size={16} />
            <span>Iniciar recorrido guiado en Google Maps</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
