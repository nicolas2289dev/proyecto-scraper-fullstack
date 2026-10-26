"""
Utilidades para consumir la API pública de catálogo de VTEX
(``/api/catalog_system/pub/products/search``), usada por Comodín en Casa, Día y Vea.

A diferencia del scraping del DOM, esta API entrega de forma estructurada la marca
(``brand``), el código de barras (``ean``), el precio de venta y la disponibilidad.
El EAN es idéntico para el mismo producto físico en todas las tiendas, lo que permite
que el backend unifique el producto maestro sin depender del texto del título.
"""
import logging
from typing import Any, Dict, List, Optional
from urllib.parse import quote

logger = logging.getLogger(__name__)

# VTEX limita cada llamada a 50 resultados (_from=0&_to=49).
VTEX_PAGE_SIZE = 50


def build_vtex_search_url(base_url: str, keyword: str, start: int = 0, end: int = VTEX_PAGE_SIZE - 1) -> str:
    """Construye la URL de búsqueda de texto completo (``ft``) de la API de catálogo VTEX."""
    return (
        f"{base_url.rstrip('/')}/api/catalog_system/pub/products/search"
        f"?ft={quote(keyword)}&_from={start}&_to={end}"
    )


def fetch_vtex_products_fallback(api_url: str, timeout: int = 20) -> Optional[List[Dict[str, Any]]]:
    """
    Petición HTTP síncrona con requests como fallback cuando el APIRequestContext
    de Playwright sufre ECONNABORTED por restricciones de red/CloudFront.
    """
    import requests
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "es-AR,es;q=0.9",
    }
    try:
        resp = requests.get(api_url, headers=headers, timeout=timeout)
        if resp.status_code in (200, 206):
            return resp.json()
        logger.info(f"Fallback HTTP devolvió status {resp.status_code} para {api_url}")
    except Exception as e:
        logger.debug(f"Fallback HTTP error para {api_url}: {e}")
    return None


def _first_offer(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Devuelve la mejor oferta comercial (``commertialOffer``) de un SKU: la primera con stock, si no la primera."""
    offers = [
        seller.get("commertialOffer") or {}
        for seller in (item.get("sellers") or [])
        if isinstance(seller, dict)
    ]
    if not offers:
        return None
    for offer in offers:
        if offer.get("AvailableQuantity", 0) and offer.get("Price"):
            return offer
    return offers[0]


def parse_vtex_products(data: Any, base_url: str, only_available: bool = True) -> List[Dict[str, Any]]:
    """
    Convierte la respuesta JSON de la API VTEX al formato interno de tarjetas del scraper.

    Args:
        data: JSON ya decodificado (lista de productos VTEX).
        base_url: URL base de la tienda, para armar URLs relativas.
        only_available: Si es True, descarta productos sin stock o sin precio válido
                        (comportamiento estándar del buscador público de los supermercados).

    Returns:
        Lista de dicts con: ``titulo``, ``url``, ``precio`` (float | None), ``precio_texto`` (None),
        ``url_imagen``, ``ean``, ``marca``, ``disponible``.
        Los productos sin título, sin URL o no disponibles (si only_available=True) se descartan.
    """
    if not isinstance(data, list):
        return []

    productos: List[Dict[str, Any]] = []
    for prod in data:
        if not isinstance(prod, dict):
            continue

        titulo = (prod.get("productName") or "").strip()
        url = prod.get("link") or ""
        if not url and prod.get("linkText"):
            url = f"{base_url.rstrip('/')}/{prod['linkText']}/p"
        if not titulo or not url:
            continue

        items = prod.get("items") or []

        # Buscar preferentemente el SKU que tenga oferta con stock y precio activo
        sku = None
        offer = None
        for candidate_sku in items:
            if not isinstance(candidate_sku, dict):
                continue
            candidate_offer = _first_offer(candidate_sku)
            if candidate_offer and candidate_offer.get("AvailableQuantity", 0) and candidate_offer.get("Price"):
                sku = candidate_sku
                offer = candidate_offer
                break

        if not sku:
            sku = items[0] if items and isinstance(items[0], dict) else {}
            offer = _first_offer(sku) or {}

        precio_raw = offer.get("Price")
        try:
            precio = float(precio_raw) if precio_raw else None
        except (TypeError, ValueError):
            precio = None

        disponible = bool(offer.get("AvailableQuantity", 0)) and precio is not None and precio > 0

        # Si solo se buscan productos disponibles y el producto no tiene stock, se descarta
        if only_available and not disponible:
            continue

        images = sku.get("images") or []
        url_imagen = images[0].get("imageUrl") if images and isinstance(images[0], dict) else ""

        ean = str(sku.get("ean") or "").strip() or None
        marca = (prod.get("brand") or "").strip() or None

        productos.append({
            "titulo": titulo,
            "url": url,
            "precio": precio,
            "precio_texto": None,
            "url_imagen": url_imagen or "",
            "ean": ean,
            "marca": marca,
            "disponible": disponible,
        })

    return productos
