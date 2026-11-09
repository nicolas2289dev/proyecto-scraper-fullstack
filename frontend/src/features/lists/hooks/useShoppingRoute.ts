import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  GeoCoordinates,
  RouteStop,
  Sucursal,
  TiendaOptima,
  TransportMode,
} from '../types/lists.types';
import { FALLBACK_SUCURSALES_JUJUY, sucursalApi } from '../api/sucursalApi';
import {
  DEFAULT_JUJUY_CENTER,
  buildGoogleMapsMultiStopUrl,
  buildOptimalChainedStops,
  fetchOsrmRoute,
  type RouteLegInfo,
} from '../utils/geoUtils';

export interface ShoppingRouteState {
  userLocation: GeoCoordinates;
  locationSource: 'gps' | 'manual' | 'default';
  locationLabel: string;
  gpsLoading: boolean;
  gpsError: string | null;
  transportMode: TransportMode;
  setTransportMode: (mode: TransportMode) => void;
  orderedStops: RouteStop[];
  polyline: [number, number][];
  legs: RouteLegInfo[];
  totalDistanceKm: number;
  totalDurationMin: number;
  routeLoading: boolean;
  googleMapsUrl: string;
  requestLiveGps: () => void;
  setManualOrigin: (coords: GeoCoordinates, label?: string) => void;
}

export function useShoppingRoute(hojaDeRuta: TiendaOptima[]): ShoppingRouteState {
  const [branches, setBranches] = useState<Sucursal[]>(FALLBACK_SUCURSALES_JUJUY);
  const [userLocation, setUserLocation] = useState<GeoCoordinates>(DEFAULT_JUJUY_CENTER);
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | 'default'>('default');
  const [locationLabel, setLocationLabel] = useState<string>(
    'Centro de San Salvador de Jujuy (Punto de referencia)'
  );
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>('walking');

  const [routeMetrics, setRouteMetrics] = useState<{
    polyline: [number, number][];
    legs: RouteLegInfo[];
    distanceKm: number;
    durationMin: number;
    loading: boolean;
  }>({
    polyline: [],
    legs: [],
    distanceKm: 0,
    durationMin: 0,
    loading: false,
  });

  const watchIdRef = useRef<number | null>(null);

  // 1. Cargar catálogo de sucursales desde el backend
  useEffect(() => {
    let active = true;
    sucursalApi.getAll().then((data) => {
      if (active && data.length > 0) {
        setBranches(data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // 2. Función para activar o refrescar GPS en tiempo real
  const requestLiveGps = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsError('Tu navegador no soporta geolocalización. Usa el buscador de calles.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationSource('gps');
        setLocationLabel('Tu ubicación actual en tiempo real (GPS)');
        setGpsLoading(false);
        setGpsError(null);
      },
      () => {
        setGpsLoading(false);
        setGpsError(
          'Permiso de ubicación no concedido. Puedes buscar tu calle o tocar el mapa para elegir tu punto de partida.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 15000,
      }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationSource('gps');
        setLocationLabel('Tu ubicación actual en tiempo real (GPS)');
        setGpsLoading(false);
        setGpsError(null);
      },
      () => {
        // Silencioso en watchPosition si ya fue manejado en getCurrentPosition
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
      }
    );
  }, []);

  // Intentar obtener GPS automáticamente al montar la vista del circuito
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      requestLiveGps();
    }, 50);

    return () => {
      window.clearTimeout(timerId);
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [requestLiveGps]);

  // 3. Permitir fijar un origen manual (desde buscador Nominatim o clic en el mapa)
  const setManualOrigin = useCallback((coords: GeoCoordinates, label?: string) => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setUserLocation(coords);
    setLocationSource('manual');
    setLocationLabel(
      label || `Punto seleccionado (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
    );
    setGpsError(null);
  }, []);

  // 4. Calcular secuencia eslabonada óptima de sucursales (Greedy Nearest Neighbor)
  const orderedStops = useMemo(() => {
    return buildOptimalChainedStops(userLocation, hojaDeRuta, branches);
  }, [userLocation, hojaDeRuta, branches]);

  // 5. Consultar ruta vial real a OSRM cada vez que cambian el origen, las paradas o el modo de transporte
  useEffect(() => {
    let active = true;

    fetchOsrmRoute(userLocation, orderedStops, transportMode).then((res) => {
      if (active) {
        setRouteMetrics({
          polyline: res.polyline,
          legs: res.legs,
          distanceKm: res.distanceKm,
          durationMin: res.durationMin,
          loading: false,
        });
      }
    });

    return () => {
      active = false;
    };
  }, [userLocation, orderedStops, transportMode]);

  // Fallback inmediato de distancia/tiempo mientras resuelve la promesa de OSRM
  const fallbackDistanceKm = useMemo(() => {
    const lastStop = orderedStops[orderedStops.length - 1];
    if (!lastStop) return 0;
    return Number((lastStop.distanciaAcumuladaKm * 1.28).toFixed(2));
  }, [orderedStops]);

  const fallbackDurationMin = useMemo(() => {
    if (fallbackDistanceKm <= 0) return 0;
    return transportMode === 'walking'
      ? Math.max(2, Math.round((fallbackDistanceKm / 4.8) * 60))
      : Math.max(2, Math.round((fallbackDistanceKm / 24) * 60 + orderedStops.length));
  }, [fallbackDistanceKm, transportMode, orderedStops.length]);

  const totalDistanceKm = routeMetrics.distanceKm > 0 ? routeMetrics.distanceKm : fallbackDistanceKm;
  const totalDurationMin = routeMetrics.durationMin > 0 ? routeMetrics.durationMin : fallbackDurationMin;

  const polyline = useMemo<[number, number][]>(() => {
    if (routeMetrics.polyline.length > 0) {
      return routeMetrics.polyline;
    }
    return [
      [userLocation.lat, userLocation.lng],
      ...orderedStops.map(
        (s): [number, number] => [s.sucursal.latitud, s.sucursal.longitud]
      ),
    ];
  }, [routeMetrics.polyline, userLocation, orderedStops]);

  const googleMapsUrl = useMemo(() => {
    return buildGoogleMapsMultiStopUrl(userLocation, orderedStops, transportMode);
  }, [userLocation, orderedStops, transportMode]);

  return {
    userLocation,
    locationSource,
    locationLabel,
    gpsLoading,
    gpsError,
    transportMode,
    setTransportMode,
    orderedStops,
    polyline,
    legs: routeMetrics.legs,
    totalDistanceKm,
    totalDurationMin,
    routeLoading: routeMetrics.loading,
    googleMapsUrl,
    requestLiveGps,
    setManualOrigin,
  };
}

