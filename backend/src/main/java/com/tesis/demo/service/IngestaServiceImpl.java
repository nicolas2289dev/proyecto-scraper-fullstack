package com.tesis.demo.service;

import com.tesis.demo.dto.IngestaResultadoDto;
import com.tesis.demo.dto.ItemIngestaDto;
import com.tesis.demo.dto.ProductoNormalizadoDto;
import com.tesis.demo.model.*;
import com.tesis.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Implementación del servicio de ingesta masiva.
 *
 * <p>Por cada {@link ItemIngestaDto} recibido del scraper, ejecuta el siguiente pipeline:</p>
 * <ol>
 *   <li>Normaliza el texto crudo mediante {@link NormalizacionService} (marca por hint de tienda o diccionario).</li>
 *   <li>Resuelve el {@link Producto} maestro: (1) por EAN, (2) por huella determinista,
 *       (3) por similitud tolerante en la marca. Así un mismo producto físico existe una sola vez.</li>
 *   <li>Si no existe → crea un nuevo {@link Producto} en el catálogo maestro.</li>
 *   <li>Verifica si ya existe el mapeo {@link ProductoTienda} para ese par (producto, supermercado).</li>
 *   <li>Si no existe → crea el mapeo con la URL específica.</li>
 *   <li>Persiste el precio actual en {@link HistorialPrecio}.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
public class IngestaServiceImpl implements IngestaService {

    private static final Logger log = LoggerFactory.getLogger(IngestaServiceImpl.class);
    private static final double UMBRAL_SIMILITUD = 0.92;

    private final NormalizacionService normalizacionService;
    private final ProductoRepository productoRepository;
    private final ProductoTiendaRepository productoTiendaRepository;
    private final HistorialPrecioRepository historialPrecioRepository;
    private final SupermercadoRepository supermercadoRepository;
    private final CriterioBusquedaRepository criterioBusquedaRepository;
    private final CategoriaRepository categoriaRepository;
    private final MarcaRepository marcaRepository;
    private final ItemListaRepository itemListaRepository;

    /** Producto maestro resuelto y si fue creado en esta ingesta. */
    private record ProductoResuelto(Producto producto, boolean nuevo) {}

    @Override
    @Transactional
    public void reiniciarCatalogo() {
        historialPrecioRepository.deleteAll();
        itemListaRepository.deleteAll();
        productoTiendaRepository.deleteAll();
        productoRepository.deleteAll();
        marcaRepository.deleteAll();
        log.info("[IngestaService] Catálogo maestro e historial de precios reiniciados exitosamente.");
    }

    @Override
    @Transactional
    public IngestaResultadoDto procesarIngestaMasiva(List<ItemIngestaDto> items) {
        int procesados = 0;
        int nuevosProductos = 0;
        int productosUnificados = 0;
        int preciosRegistrados = 0;
        int errores = 0;

        // Diccionario de marcas: se carga una vez por lote y se enriquece durante el mismo
        Set<String> marcasConocidas = new LinkedHashSet<>();
        marcaRepository.findAll().forEach(m -> marcasConocidas.add(m.getNombre()));

        for (ItemIngestaDto item : items) {
            procesados++;
            try {
                boolean esNuevo = procesarItem(item, marcasConocidas);
                if (esNuevo) {
                    nuevosProductos++;
                } else {
                    productosUnificados++;
                }
                preciosRegistrados++;
            } catch (IllegalArgumentException e) {
                errores++;
                log.warn("[IngestaService] Ítem omitido por validación semántica: {}", e.getMessage());
            } catch (Exception e) {
                errores++;
                log.error("[IngestaService] Error inesperado procesando ítem '{}' del supermercado {}: {}",
                        item.getTextoCrudoTienda(), item.getSupermercadoId(), e.getMessage(), e);
            }
        }

        log.info("[IngestaService] Ingesta masiva completada. Procesados: {}, Nuevos: {}, Unificados: {}, Precios: {}, Errores: {}",
                procesados, nuevosProductos, productosUnificados, preciosRegistrados, errores);

        return IngestaResultadoDto.builder()
                .procesados(procesados)
                .nuevosProductos(nuevosProductos)
                .productosUnificados(productosUnificados)
                .preciosRegistrados(preciosRegistrados)
                .errores(errores)
                .build();
    }

    /**
     * Procesa un único ítem del scraper.
     *
     * @return true si se creó un producto nuevo, false si se unificó con uno existente
     */
    private boolean procesarItem(ItemIngestaDto item, Set<String> marcasConocidas) {
        // ── PASO 0: Validar compatibilidad semántica del ítem ─────────────────
        if (!normalizacionService.esItemCompatible(item.getTextoCrudoTienda(), item.getPalabraClaveBuscada())) {
            throw new IllegalArgumentException(String.format("El producto '%s' no es compatible con el término de búsqueda '%s'",
                    item.getTextoCrudoTienda(), item.getPalabraClaveBuscada()));
        }

        // ── PASO 1: Normalizar el texto crudo ─────────────────────────────────
        ProductoNormalizadoDto normalizado = normalizacionService.normalizar(
                item.getTextoCrudoTienda(),
                item.getPalabraClaveBuscada(),
                item.getMarcaTienda(),
                item.getPesoValor(),
                item.getPesoUnidad(),
                marcasConocidas
        );
        log.debug("[IngestaService] Normalizado: {} | Marca: {} | Variante: {} | Peso: {} {}",
                normalizado.getNombreGenerico(), normalizado.getMarca(),
                normalizado.getVarianteEspecifica(), normalizado.getPesoValor(), normalizado.getPesoUnidad());

        // ── PASO 2: Resolver el producto maestro (EAN → huella → similitud) ───
        Categoria categoria = resolverCategoria(item.getPalabraClaveBuscada());
        ProductoResuelto resuelto = resolverProductoMaestro(normalizado, limpiarEan(item.getEan()), categoria);
        Producto producto = resuelto.producto();
        boolean esNuevo = resuelto.nuevo();

        // Marca informada por la tienda → se aprende en el diccionario
        registrarMarca(item.getMarcaTienda(), normalizado.getMarca(), marcasConocidas);

        // ── PASO 4: Obtener supermercado ──────────────────────────────────────
        Supermercado supermercado = supermercadoRepository.findById(item.getSupermercadoId())
                .orElseThrow(() -> new RuntimeException(
                        "Supermercado no encontrado con id: " + item.getSupermercadoId()));

        // ── PASO 5: Verificar/crear mapeo ProductoTienda ──────────────────────
        Optional<ProductoTienda> productoTiendaOpt =
                productoTiendaRepository.findByProductoIdAndSupermercadoId(
                        producto.getId(), supermercado.getId());

        ProductoTienda productoTienda;
        if (productoTiendaOpt.isEmpty()) {
            productoTienda = new ProductoTienda();
            productoTienda.setProducto(producto);
            productoTienda.setSupermercado(supermercado);
            productoTienda.setUrlEspecifica(item.getUrlEspecifica());
            productoTienda.setUrlImagen(item.getUrlImagen());
            productoTienda = productoTiendaRepository.save(productoTienda);
            log.debug("[IngestaService] Nuevo ProductoTienda creado: ID={}", productoTienda.getId());
        } else {
            productoTienda = productoTiendaOpt.get();
            boolean changed = false;
            // Actualizar URL si cambió
            if (item.getUrlEspecifica() != null &&
                !item.getUrlEspecifica().equals(productoTienda.getUrlEspecifica())) {
                productoTienda.setUrlEspecifica(item.getUrlEspecifica());
                changed = true;
            }
            // Actualizar URL de imagen si cambió
            if (item.getUrlImagen() != null &&
                !item.getUrlImagen().equals(productoTienda.getUrlImagen())) {
                productoTienda.setUrlImagen(item.getUrlImagen());
                changed = true;
            }
            // Persistir solo si hubo cambios reales
            if (changed) {
                productoTienda = productoTiendaRepository.save(productoTienda);
            }
        }

        // ── PASO 6: Persistir precio en historial ─────────────────────────────
        if (item.getPrecioActual() != null && item.getPrecioActual().compareTo(BigDecimal.ZERO) > 0) {
            HistorialPrecio historial = new HistorialPrecio();
            historial.setProductoTienda(productoTienda);
            historial.setPrecio(item.getPrecioActual());
            historial.setFechaRecoleccion(LocalDateTime.now());
            historialPrecioRepository.save(historial);
        } else {
            log.warn("[IngestaService] Ítem '{}' sin precio válido. Se omite registro en historial.",
                    item.getTextoCrudoTienda());
        }

        return esNuevo;
    }

    /**
     * Resuelve el producto maestro de un ítem. Orden de criterios:
     * <ol>
     *   <li><b>EAN</b>: mismo código de barras = mismo producto físico, sin importar el título.</li>
     *   <li><b>Huella determinista</b> en la categoría. Si el mismo texto pertenece a otro EAN
     *       (p. ej. dos packs distintos con igual título), se crea un producto distinto.</li>
     *   <li><b>Similitud tolerante</b> (marca con errores tipográficos), solo entre productos sin EAN
     *       contradictorio.</li>
     * </ol>
     */
    private ProductoResuelto resolverProductoMaestro(ProductoNormalizadoDto normalizado, String ean, Categoria categoria) {
        // Criterio 1: EAN
        if (ean != null) {
            Optional<Producto> porEan = productoRepository.findByEan(ean);
            if (porEan.isPresent()) {
                log.debug("[IngestaService] Producto unificado por EAN {}: ID={}", ean, porEan.get().getId());
                return new ProductoResuelto(porEan.get(), false);
            }
        }

        String claveBase = normalizacionService.generarClave(
                normalizado.getNombreGenerico(), normalizado.getMarca(), normalizado.getVarianteEspecifica(),
                normalizado.getPesoValor(), normalizado.getPesoUnidad());
        String clave = claveBase;
        Producto match = null;
        boolean conflictoDeEan = false;

        // Criterio 2: huella determinista
        Optional<Producto> porClave = productoRepository
                .findByCategoriaIdAndClaveNormalizada(categoria.getId(), claveBase);
        if (porClave.isPresent()) {
            Producto candidato = porClave.get();
            if (ean == null || candidato.getEan() == null || candidato.getEan().equals(ean)) {
                match = candidato;
            } else {
                conflictoDeEan = true;
                clave = claveBase + "#" + ean;
            }
        }

        // Criterio 3: similitud tolerante (si ambos tienen EAN y difieren, son productos distintos)
        if (match == null && !conflictoDeEan) {
            match = productoRepository.findAllByNombreGenericoIgnoreCase(normalizado.getNombreGenerico()).stream()
                    .filter(c -> c.getCategoria() != null && categoria.getId().equals(c.getCategoria().getId()))
                    .filter(c -> c.getEan() == null || ean == null)
                    .filter(c -> normalizacionService.esSimilar(c, normalizado, UMBRAL_SIMILITUD))
                    .findFirst()
                    .orElse(null);
        }

        if (match != null) {
            boolean cambio = false;
            if (match.getEan() == null && ean != null) {
                match.setEan(ean);
                cambio = true;
            }
            if (match.getClaveNormalizada() == null) {
                match.setClaveNormalizada(claveBase);
                cambio = true;
            }
            if (cambio) {
                match = productoRepository.save(match);
            }
            log.debug("[IngestaService] Producto unificado: ID={}", match.getId());
            return new ProductoResuelto(match, false);
        }

        // Sin coincidencias: insertar nuevo producto maestro
        Producto nuevo = new Producto();
        nuevo.setNombreGenerico(normalizado.getNombreGenerico());
        nuevo.setMarca(normalizado.getMarca());
        nuevo.setVarianteEspecifica(normalizado.getVarianteEspecifica());
        nuevo.setPesoValor(normalizado.getPesoValor());
        nuevo.setPesoUnidad(normalizado.getPesoUnidad());
        nuevo.setCategoria(categoria);
        nuevo.setEan(ean);
        nuevo.setClaveNormalizada(clave);
        nuevo = productoRepository.save(nuevo);
        log.info("[IngestaService] Nuevo producto creado: ID={} | {} | {} {} | EAN={}",
                nuevo.getId(), nuevo.getNombreGenerico(), nuevo.getMarca(), nuevo.getVarianteEspecifica(), ean);
        return new ProductoResuelto(nuevo, true);
    }

    /** Acepta solo códigos numéricos de 8 a 14 dígitos (EAN-8/UPC/EAN-13/GTIN-14). */
    private String limpiarEan(String ean) {
        if (ean == null) return null;
        String limpio = ean.trim();
        return limpio.matches("\\d{8,14}") ? limpio : null;
    }

    /** Agrega la marca informada por la tienda al diccionario si todavía no existe. */
    private void registrarMarca(String marcaTienda, String marcaNormalizada, Set<String> marcasConocidas) {
        if (marcaTienda == null || marcaTienda.isBlank() || marcaNormalizada == null) return;
        boolean existe = marcasConocidas.stream().anyMatch(m -> m.equalsIgnoreCase(marcaNormalizada));
        if (existe) return;
        Marca marca = new Marca();
        marca.setNombre(marcaNormalizada);
        marcaRepository.save(marca);
        marcasConocidas.add(marcaNormalizada);
    }

    /**
     * Resuelve la categoría del producto buscando en criterios_busqueda por la palabraClave.
     * Si no encuentra un criterio, usa la categoría por defecto (id=1) o la primera disponible.
     */
    private Categoria resolverCategoria(String palabraClave) {
        try {
            CriterioBusqueda criterio = criterioBusquedaRepository
                    .findByTerminoBusquedaIgnoreCase(palabraClave.trim().toLowerCase());
            if (criterio != null) {
                return criterio.getCategoria();
            }
        } catch (Exception e) {
            log.warn("[IngestaService] Error al resolver categoría para '{}': {}. Usando categoría por defecto.", palabraClave, e.getMessage());
        }
        // Fallback: primera categoría disponible
        return categoriaRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException(
                        "No existe ninguna categoría en la BD. Creá al menos una antes de ingestar."));
    }
}
