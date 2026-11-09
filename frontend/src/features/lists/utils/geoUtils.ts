import type {
  AddressSuggestion,
  GeoCoordinates,
  RouteStop,
  Sucursal,
  TiendaOptima,
  TransportMode,
} from '../types/lists.types';

/**
 * Coordenadas por defecto: Plaza Gral. Belgrano (Centro de San Salvador de Jujuy)
 */
export const DEFAULT_JUJUY_CENTER: GeoCoordinates = {
  lat: -24.1858,
  lng: -65.2995,
};

/**
 * Normaliza el nombre de una cadena de supermercados para emparejar sin tildes ni sufijos
 */
export function normalizeBrandKey(name: string): string {
  const clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (clean.includes('comodin')) return 'comodin';
  if (clean.includes('dia')) return 'dia';
  if (clean.includes('vea')) return 'vea';
  if (clean.includes('jumbo')) return 'jumbo';
  if (clean.includes('carrefour')) return 'carrefour';
  return clean;
}

/**
 * Calcula la distancia geodésica en kilómetros entre dos coordenadas usando la fórmula de Haversine.
 */
export function calculateHaversineKm(a: GeoCoordinates, b: GeoCoordinates): number {
  const R = 6371; // Radio terrestre en km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

/**
 * Filtra las sucursales pertenecientes a una tienda del circuito (por ID o por clave de marca normalizada).
 */
export function getBranchesForStore(store: TiendaOptima, allBranches: Sucursal[]): Sucursal[] {
  const storeBrand = normalizeBrandKey(store.supermercadoNombre);
  const byBrand = allBranches.filter(
    (b) => normalizeBrandKey(b.supermercadoNombre) === storeBrand
  );
  if (byBrand.length > 0) {
    return byBrand;
  }
  return allBranches.filter((b) => b.supermercadoId === store.supermercadoId);
}

/**
 * Algoritmo Eslabonado de Vecino Más Cercano (Chained Greedy Nearest Neighbor):
 * 1. Parte de la ubicación del usuario (origin).
 * 2. Entre todas las cadenas pendientes en `hojaDeRuta`, busca la sucursal física más cercana a la posición actual.
 * 3. Esa sucursal pasa a ser la siguiente parada y la nueva posición actual desde donde se evalúa la próxima cadena.
 * 4. No incluye regreso a casa.
 */
export function buildOptimalChainedStops(
  origin: GeoCoordinates,
  hojaDeRuta: TiendaOptima[],
  allBranches: Sucursal[]
): RouteStop[] {
  if (!hojaDeRuta || hojaDeRuta.length === 0 || allBranches.length === 0) {
    return [];
  }

  const remainingStores = [...hojaDeRuta];
  const orderedStops: RouteStop[] = [];
  let currentPos: GeoCoordinates = { ...origin };
  let cumulativeKm = 0;
  let stepOrder = 1;

  while (remainingStores.length > 0) {
    let bestStoreIdx = 0;
    let bestBranch: Sucursal | null = null;
    let bestDistanceKm = Number.POSITIVE_INFINITY;

    for (let i = 0; i < remainingStores.length; i++) {
      const candidateStore = remainingStores[i];
      const storeBranches = getBranchesForStore(candidateStore, allBranches);

      for (const branch of storeBranches) {
        const dist = calculateHaversineKm(currentPos, {
          lat: branch.latitud,
          lng: branch.longitud,
        });
        if (dist < bestDistanceKm) {
          bestDistanceKm = dist;
          bestStoreIdx = i;
          bestBranch = branch;
        }
      }
    }

    const chosenStore = remainingStores.splice(bestStoreIdx, 1)[0];

    // Fallback si alguna cadena no tuviera sucursal mapeada
    const resolvedBranch: Sucursal = bestBranch ?? {
      id: chosenStore.supermercadoId * 1000 + stepOrder,
      supermercadoId: chosenStore.supermercadoId,
      supermercadoNombre: chosenStore.supermercadoNombre,
      nombreSucursal: `${chosenStore.supermercadoNombre} Centro`,
      direccion: 'Av. Gral. Belgrano s/n',
      ciudad: 'San Salvador de Jujuy',
      latitud: DEFAULT_JUJUY_CENTER.lat + stepOrder * 0.002,
      longitud: DEFAULT_JUJUY_CENTER.lng + stepOrder * 0.002,
    };

    const legDistanceKm = Number.isFinite(bestDistanceKm)
      ? bestDistanceKm
      : calculateHaversineKm(currentPos, {
          lat: resolvedBranch.latitud,
          lng: resolvedBranch.longitud,
        });

    cumulativeKm += legDistanceKm;

    orderedStops.push({
      orden: stepOrder,
      tienda: chosenStore,
      sucursal: resolvedBranch,
      distanciaDesdeAnteriorKm: Number(legDistanceKm.toFixed(2)),
      distanciaAcumuladaKm: Number(cumulativeKm.toFixed(2)),
    });

    currentPos = {
      lat: resolvedBranch.latitud,
      lng: resolvedBranch.longitud,
    };
    stepOrder++;
  }

  return orderedStops;
}

export interface RouteLegInfo {
  legIndex: number;
  fromName: string;
  toName: string;
  distanceKm: number;
  durationMin: number;
  color: string;
  polyline: [number, number][];
}

export interface OsrmRouteResult {
  polyline: [number, number][];
  legs: RouteLegInfo[];
  distanceKm: number;
  durationMin: number;
  isFallback: boolean;
}

const LEG_COLORS = ['#059669', '#2563eb', '#8b5cf6', '#ea580c', '#0891b2'];

/**
 * Consulta la ruta vial real a OSRM entre el origen del usuario y las paradas ordenadas.
 * Si el servicio externo no responde, aplica un fallback geodésico con factor de sinuosidad urbana (1.28x).
 */
export async function fetchOsrmRoute(
  origin: GeoCoordinates,
  stops: RouteStop[],
  mode: TransportMode
): Promise<OsrmRouteResult> {
  if (stops.length === 0) {
    return {
      polyline: [[origin.lat, origin.lng]],
      legs: [],
      distanceKm: 0,
      durationMin: 0,
      isFallback: false,
    };
  }

  const waypoints: GeoCoordinates[] = [
    origin,
    ...stops.map((s) => ({ lat: s.sucursal.latitud, lng: s.sucursal.longitud })),
  ];

  const coordsParam = waypoints.map((pt) => `${pt.lng},${pt.lat}`).join(';');

  // Usar los servidores oficiales de OpenStreetMap (FOSSGIS) con perfiles específicos:
  // - Para 'walking' (a pie): routed-foot ignora manos únicas vehiculares y transita por veredas y calles en ambos sentidos
  // - Para 'driving' (en auto): routed-car respeta estrictamente las direcciones y manos únicas vehiculares
  const primaryUrl =
    mode === 'walking'
      ? `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coordsParam}?overview=full&geometries=geojson&steps=true`
      : `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordsParam}?overview=full&geometries=geojson&steps=true`;

  const fallbackUrl = `https://router.project-osrm.org/route/v1/${
    mode === 'walking' ? 'foot' : 'driving'
  }/${coordsParam}?overview=full&geometries=geojson&steps=true`;

  const fetchRouteData = async (targetUrl: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    try {
      const response = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  };

  try {
    let data = await fetchRouteData(primaryUrl);
    if (!data?.routes?.[0]) {
      data = await fetchRouteData(fallbackUrl);
    }

    const route = data?.routes?.[0];
    const rawCoords: [number, number][] | undefined = route?.geometry?.coordinates;

    if (!route || !Array.isArray(rawCoords) || rawCoords.length === 0) {
      throw new Error('Geometría OSRM vacía');
    }

    // GeoJSON usa [lng, lat], Leaflet usa [lat, lng]
    const polyline: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);
    const distanceKm = Number(((route.distance || 0) / 1000).toFixed(2));

    // Cálculo realista de duración según modo de transporte
    const durationMin =
      mode === 'walking'
        ? Math.max(2, Math.round((distanceKm / 4.8) * 60))
        : Math.max(2, Math.round((distanceKm / 24) * 60 + stops.length));

    // Procesar tramos (legs) independientes con sus colores correspondientes
    const legs: RouteLegInfo[] = Array.isArray(route.legs)
      ? route.legs.map((leg: any, idx: number) => {
          const legCoords: [number, number][] = [];
          if (Array.isArray(leg.steps)) {
            leg.steps.forEach((st: any) => {
              if (Array.isArray(st.geometry?.coordinates)) {
                st.geometry.coordinates.forEach(([lng, lat]: [number, number]) => {
                  legCoords.push([lat, lng]);
                });
              }
            });
          }

          // Asegurar conexión precisa sin desfases visuales con el punto exacto de partida y destino
          if (idx === 0) {
            legCoords.unshift([origin.lat, origin.lng]);
          } else if (stops[idx - 1]) {
            legCoords.unshift([stops[idx - 1].sucursal.latitud, stops[idx - 1].sucursal.longitud]);
          }

          if (stops[idx]) {
            legCoords.push([stops[idx].sucursal.latitud, stops[idx].sucursal.longitud]);
          }

          const fromName =
            idx === 0
              ? 'Tú'
              : stops[idx - 1]?.sucursal.nombreSucursal || `Parada ${idx}`;
          const toName =
            stops[idx]?.sucursal.nombreSucursal || `Parada ${idx + 1}`;
          const legDistKm = Number(((leg.distance || 0) / 1000).toFixed(2));
          const legDurMin =
            mode === 'walking'
              ? Math.max(1, Math.round((legDistKm / 4.8) * 60))
              : Math.max(1, Math.round((legDistKm / 24) * 60 + 1));

          return {
            legIndex: idx + 1,
            fromName,
            toName,
            distanceKm: legDistKm,
            durationMin: legDurMin,
            color: LEG_COLORS[idx % LEG_COLORS.length],
            polyline: legCoords.length > 0 ? legCoords : polyline,
          };
        })
      : [];

    // Polyline global asegurando anclaje exacto en el punto de origen
    const fullPolyline: [number, number][] = [
      [origin.lat, origin.lng],
      ...polyline,
    ];

    return {
      polyline: fullPolyline,
      legs,
      distanceKm,
      durationMin,
      isFallback: false,
    };
  } catch {
    // Fallback geodésico si OSRM no está disponible
    const fallbackPolyline: [number, number][] = waypoints.map((pt) => [pt.lat, pt.lng]);
    const haversineTotal = stops[stops.length - 1]?.distanciaAcumuladaKm || 0.8;
    const estimatedRoadKm = Number((haversineTotal * 1.28).toFixed(2));
    const durationMin =
      mode === 'walking'
        ? Math.max(2, Math.round((estimatedRoadKm / 4.8) * 60))
        : Math.max(2, Math.round((estimatedRoadKm / 24) * 60 + stops.length));

    const fallbackLegs: RouteLegInfo[] = stops.map((s, idx) => {
      const fromPt = idx === 0 ? origin : { lat: stops[idx - 1].sucursal.latitud, lng: stops[idx - 1].sucursal.longitud };
      const toPt = { lat: s.sucursal.latitud, lng: s.sucursal.longitud };
      const legDist = s.distanciaDesdeAnteriorKm;
      return {
        legIndex: idx + 1,
        fromName: idx === 0 ? 'Tú' : stops[idx - 1].sucursal.nombreSucursal,
        toName: s.sucursal.nombreSucursal,
        distanceKm: legDist,
        durationMin: mode === 'walking' ? Math.max(1, Math.round((legDist / 4.8) * 60)) : Math.max(1, Math.round((legDist / 24) * 60 + 1)),
        color: LEG_COLORS[idx % LEG_COLORS.length],
        polyline: [[fromPt.lat, fromPt.lng], [toPt.lat, toPt.lng]],
      };
    });

    return {
      polyline: fallbackPolyline,
      legs: fallbackLegs,
      distanceKm: estimatedRoadKm,
      durationMin,
      isFallback: true,
    };
  }
}

/**
 * Busca calles o direcciones en Jujuy / Argentina utilizando Nominatim de OpenStreetMap.
 */
export async function searchAddressNominatim(query: string): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const searchQuery = trimmed.toLowerCase().includes('jujuy')
    ? trimmed
    : `${trimmed}, Jujuy, Argentina`;

  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=ar&q=${encodeURIComponent(
    searchQuery
  )}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
      },
    });
    if (!response.ok) return [];

    const items = await response.json();
    if (!Array.isArray(items)) return [];

    return items.map((item: Record<string, unknown>) => {
      const displayName = String(item.display_name || '');
      const parts = displayName.split(',').map((p) => p.trim());
      const shortName = parts.slice(0, 3).join(', ') || displayName;
      return {
        displayName,
        shortName,
        lat: Number(item.lat),
        lng: Number(item.lon),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Genera el enlace oficial de Google Maps Directions con múltiples paradas (origin, waypoints y destination).
 */
export function buildGoogleMapsMultiStopUrl(
  origin: GeoCoordinates,
  stops: RouteStop[],
  mode: TransportMode
): string {
  if (stops.length === 0) {
    return `https://www.google.com/maps/@${origin.lat},${origin.lng},15z`;
  }

  const lastStop = stops[stops.length - 1];
  const intermediateStops = stops.slice(0, -1);

  const params = new URLSearchParams({
    api: '1',
    origin: `${origin.lat},${origin.lng}`,
    destination: `${lastStop.sucursal.latitud},${lastStop.sucursal.longitud}`,
    travelmode: mode === 'walking' ? 'walking' : 'driving',
  });

  if (intermediateStops.length > 0) {
    const waypointsStr = intermediateStops
      .map((s) => `${s.sucursal.latitud},${s.sucursal.longitud}`)
      .join('|');
    params.set('waypoints', waypointsStr);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

