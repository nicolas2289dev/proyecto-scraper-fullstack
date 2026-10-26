package com.tesis.demo.service;

import com.tesis.demo.dto.IngestaResultadoDto;
import com.tesis.demo.dto.ItemIngestaDto;
import com.tesis.demo.model.*;
import com.tesis.demo.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Verifica de punta a punta (con repositorios en memoria) que un mismo producto físico
 * ingestado desde distintas tiendas queda como UN solo {@link Producto} maestro.
 */
class IngestaServiceUnificacionTest {

    private static final String EAN_SWIFT_90 = "7790360720115";

    private final List<Producto> productos = new ArrayList<>();
    private final List<ProductoTienda> productosTienda = new ArrayList<>();
    private final List<HistorialPrecio> historial = new ArrayList<>();
    private final List<Marca> marcas = new ArrayList<>();
    private final AtomicLong ids = new AtomicLong(1);

    private IngestaServiceImpl service;

    @BeforeEach
    void setUp() {
        ProductoRepository productoRepository = mock(ProductoRepository.class);
        ProductoTiendaRepository productoTiendaRepository = mock(ProductoTiendaRepository.class);
        HistorialPrecioRepository historialRepository = mock(HistorialPrecioRepository.class);
        SupermercadoRepository supermercadoRepository = mock(SupermercadoRepository.class);
        CriterioBusquedaRepository criterioRepository = mock(CriterioBusquedaRepository.class);
        CategoriaRepository categoriaRepository = mock(CategoriaRepository.class);
        MarcaRepository marcaRepository = mock(MarcaRepository.class);
        ItemListaRepository itemListaRepository = mock(ItemListaRepository.class);

        Categoria categoria = new Categoria(1L, "Fiambres y conservas");
        when(categoriaRepository.findAll()).thenReturn(List.of(categoria));

        for (long id = 1; id <= 3; id++) {
            Supermercado s = new Supermercado(id, "Super " + id, "https://super" + id + ".com");
            when(supermercadoRepository.findById(id)).thenReturn(Optional.of(s));
        }

        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> {
            Producto p = inv.getArgument(0);
            if (p.getId() == null) {
                p.setId(ids.getAndIncrement());
                productos.add(p);
            }
            return p;
        });
        when(productoRepository.findByEan(anyString())).thenAnswer(inv ->
                productos.stream().filter(p -> inv.getArgument(0).equals(p.getEan())).findFirst());
        when(productoRepository.findByCategoriaIdAndClaveNormalizada(anyLong(), anyString())).thenAnswer(inv ->
                productos.stream().filter(p -> inv.getArgument(1).equals(p.getClaveNormalizada())).findFirst());
        when(productoRepository.findAllByNombreGenericoIgnoreCase(anyString())).thenAnswer(inv ->
                productos.stream().filter(p -> p.getNombreGenerico().equalsIgnoreCase(inv.getArgument(0))).toList());

        when(productoTiendaRepository.save(any(ProductoTienda.class))).thenAnswer(inv -> {
            ProductoTienda pt = inv.getArgument(0);
            if (pt.getId() == null) {
                pt.setId(ids.getAndIncrement());
                productosTienda.add(pt);
            }
            return pt;
        });
        when(productoTiendaRepository.findByProductoIdAndSupermercadoId(anyLong(), anyLong())).thenAnswer(inv ->
                productosTienda.stream()
                        .filter(pt -> pt.getProducto().getId().equals(inv.getArgument(0))
                                && pt.getSupermercado().getId().equals(inv.getArgument(1)))
                        .findFirst());

        when(historialRepository.save(any(HistorialPrecio.class))).thenAnswer(inv -> {
            HistorialPrecio h = inv.getArgument(0);
            historial.add(h);
            return h;
        });

        when(marcaRepository.findAll()).thenAnswer(inv -> new ArrayList<>(marcas));
        when(marcaRepository.save(any(Marca.class))).thenAnswer(inv -> {
            Marca m = inv.getArgument(0);
            marcas.add(m);
            return m;
        });

        service = new IngestaServiceImpl(new NormalizacionServiceImpl(), productoRepository,
                productoTiendaRepository, historialRepository, supermercadoRepository,
                criterioRepository, categoriaRepository, marcaRepository, itemListaRepository);
    }

    private ItemIngestaDto item(long superId, String titulo, String marca, String ean, String precio) {
        ItemIngestaDto dto = new ItemIngestaDto();
        dto.setTextoCrudoTienda(titulo);
        dto.setUrlEspecifica("https://super" + superId + ".com/" + titulo.replace(' ', '-') + "/p");
        dto.setPrecioActual(new BigDecimal(precio));
        dto.setDisponibilidad(true);
        dto.setSupermercadoId(superId);
        dto.setPalabraClaveBuscada("picadillo");
        dto.setMarcaTienda(marca);
        dto.setEan(ean);
        return dto;
    }

    @Test
    void mismoPicadilloEnTresTiendas_unSoloProductoMaestro() {
        IngestaResultadoDto r = service.procesarIngestaMasiva(List.of(
                item(1, "Picadillo Swift De Carne x 90 Gr", "Swift", EAN_SWIFT_90, "1100.50"),
                item(2, "Picadillo Swift de Carne 90 Gr.", "SWIFT", EAN_SWIFT_90, "1280.00"),
                item(3, "Picadillo De Carne Swift 90 Gr", "SWIFT", EAN_SWIFT_90, "1199.99")));

        assertEquals(1, productos.size());
        assertEquals(3, productosTienda.size());
        assertEquals(3, historial.size());
        assertEquals(1, r.getNuevosProductos());
        assertEquals(2, r.getProductosUnificados());
        assertEquals(0, r.getErrores());

        Producto maestro = productos.get(0);
        assertEquals("Swift", maestro.getMarca());
        assertEquals("Carne", maestro.getVarianteEspecifica());
        assertEquals(EAN_SWIFT_90, maestro.getEan());
    }

    @Test
    void sinEan_unificaPorHuellaSinImportarElOrdenDelTitulo() {
        service.procesarIngestaMasiva(List.of(
                item(1, "Picadillo Swift De Carne x 90 Gr", "Swift", null, "1100"),
                item(3, "Picadillo De Carne Swift 90 Gr", "SWIFT", null, "1199")));

        assertEquals(1, productos.size());
        assertEquals(2, productosTienda.size());
    }

    @Test
    void sinHintDeMarca_elDiccionarioAprendidoUnificaTitulosPosteriores() {
        // El primer ítem informa la marca → se aprende; el segundo viene sin marca y se resuelve por diccionario
        service.procesarIngestaMasiva(List.of(
                item(1, "Picadillo Swift De Carne x 90 Gr", "Swift", null, "1100"),
                item(3, "Picadillo De Carne Swift 90 Gr", null, null, "1199")));

        assertEquals(1, productos.size());
        assertEquals(1, marcas.size());
    }

    @Test
    void mismoTituloConEanDistinto_sonProductosDistintos() {
        // Vea publica dos "Picadillo De Carne Swift 85 Gr" con EAN distinto
        service.procesarIngestaMasiva(List.of(
                item(3, "Picadillo De Carne Swift 85 Gr", "SWIFT", "7790360964502", "900"),
                item(3, "Picadillo De Carne Swift 85 Gr", "SWIFT", "7790360964496", "950")));

        assertEquals(2, productos.size());
        assertNotEquals(productos.get(0).getClaveNormalizada(), productos.get(1).getClaveNormalizada());
    }

    @Test
    void variantesDiferentes_noSeFusionan() {
        service.procesarIngestaMasiva(List.of(
                item(3, "Picadillo De Carne Swift 90 Gr", "SWIFT", null, "1100"),
                item(3, "Picadillo Sabor Picante 90 Grs Swift", "SWIFT", null, "1200")));

        assertEquals(2, productos.size());
    }

    @Test
    void reingestarElMismoLote_esIdempotenteEnProductos() {
        List<ItemIngestaDto> lote = List.of(
                item(1, "Picadillo Swift De Carne x 90 Gr", "Swift", EAN_SWIFT_90, "1100"),
                item(2, "Picadillo Swift de Carne 90 Gr.", "SWIFT", EAN_SWIFT_90, "1280"));

        service.procesarIngestaMasiva(lote);
        IngestaResultadoDto segunda = service.procesarIngestaMasiva(lote);

        assertEquals(1, productos.size());
        assertEquals(2, productosTienda.size());
        assertEquals(0, segunda.getNuevosProductos());
        assertEquals(4, historial.size(), "Cada ingesta agrega un punto al historial de precios");
    }

    @Test
    void reiniciarCatalogo_ejecutaDeleteAllEnTodasLasEntidades() {
        assertDoesNotThrow(() -> service.reiniciarCatalogo());
    }
}
