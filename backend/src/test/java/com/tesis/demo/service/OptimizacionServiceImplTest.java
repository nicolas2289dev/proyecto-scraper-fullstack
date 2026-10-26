package com.tesis.demo.service;

import com.tesis.demo.dto.HistorialPrecioDto;
import com.tesis.demo.dto.ItemListaConPrecioDto;
import com.tesis.demo.dto.ListaCompraDetalleDto;
import com.tesis.demo.dto.OptimizacionCompraDto;
import com.tesis.demo.model.Producto;
import com.tesis.demo.model.ProductoTienda;
import com.tesis.demo.model.Supermercado;
import com.tesis.demo.repository.ProductoRepository;
import com.tesis.demo.repository.ProductoTiendaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OptimizacionServiceImplTest {

    @Mock
    private ListaCompraService listaCompraService;

    @Mock
    private ItemListaService itemListaService;

    @Mock
    private HistorialPrecioService historialPrecioService;

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private ProductoTiendaRepository productoTiendaRepository;

    @InjectMocks
    private OptimizacionServiceImpl optimizacionService;

    @Test
    void generarCircuitoOptimo_debeCompararContraPrecioSeleccionadoYCalcularAhorroCorrecto() {
        Long listaId = 5L;
        String userEmail = "test@ejemplo.com";
        Long productoId = 60L;

        // Ítem en la lista con Comodín en Casa seleccionado (1291.69)
        ItemListaConPrecioDto itemConPrecio = new ItemListaConPrecioDto();
        itemConPrecio.setId(20L);
        itemConPrecio.setProductoId(productoId);
        itemConPrecio.setProductoNombre("Picadillo");
        itemConPrecio.setMarca("Swift");
        itemConPrecio.setCantidad(1);
        itemConPrecio.setSupermercadoId(1L);
        itemConPrecio.setSupermercadoNombre("Comodín en Casa");
        itemConPrecio.setPrecioUnitario(BigDecimal.valueOf(1291.69));
        itemConPrecio.setPrecioTotal(BigDecimal.valueOf(1291.69));

        ListaCompraDetalleDto detalle = new ListaCompraDetalleDto(
                listaId,
                "ejemplo",
                LocalDateTime.now(),
                false,
                List.of(itemConPrecio),
                BigDecimal.valueOf(1291.69)
        );

        when(listaCompraService.obtenerListaDetalle(listaId, userEmail)).thenReturn(detalle);

        Producto producto = new Producto();
        producto.setId(productoId);
        producto.setNombreGenerico("Picadillo");
        producto.setMarca("Swift");
        when(productoRepository.findById(productoId)).thenReturn(Optional.of(producto));

        // Tienda 1: Comodín (1291.69)
        Supermercado sComodin = new Supermercado();
        sComodin.setId(1L);
        sComodin.setNombre("Comodín en Casa");
        ProductoTienda ptComodin = new ProductoTienda();
        ptComodin.setId(10L);
        ptComodin.setSupermercado(sComodin);

        // Tienda 2: Día (970.00 - óptimo)
        Supermercado sDia = new Supermercado();
        sDia.setId(2L);
        sDia.setNombre("Día");
        ProductoTienda ptDia = new ProductoTienda();
        ptDia.setId(20L);
        ptDia.setSupermercado(sDia);

        // Tienda 3: Vea (1295.00 - el más caro del mercado)
        Supermercado sVea = new Supermercado();
        sVea.setId(3L);
        sVea.setNombre("Vea");
        ProductoTienda ptVea = new ProductoTienda();
        ptVea.setId(30L);
        ptVea.setSupermercado(sVea);

        when(productoTiendaRepository.findByProductoId(productoId))
                .thenReturn(List.of(ptComodin, ptDia, ptVea));

        when(historialPrecioService.obtenerUltimoPorProductoTienda(10L))
                .thenReturn(new HistorialPrecioDto(1L, 10L, productoId, "Picadillo", 1L, "Comodín en Casa", BigDecimal.valueOf(1291.69), LocalDateTime.now()));
        when(historialPrecioService.obtenerUltimoPorProductoTienda(20L))
                .thenReturn(new HistorialPrecioDto(2L, 20L, productoId, "Picadillo", 2L, "Día", BigDecimal.valueOf(970.00), LocalDateTime.now()));
        when(historialPrecioService.obtenerUltimoPorProductoTienda(30L))
                .thenReturn(new HistorialPrecioDto(3L, 30L, productoId, "Picadillo", 3L, "Vea", BigDecimal.valueOf(1295.00), LocalDateTime.now()));

        OptimizacionCompraDto resultado = optimizacionService.generarCircuitoOptimo(listaId, userEmail);

        assertNotNull(resultado);
        // Total óptimo: 970.00 (en Día)
        assertEquals(new BigDecimal("970.00"), resultado.getTotalOptimo());
        // Base de comparación: 1291.69 (precio seleccionado en Comodín en Casa)
        assertEquals(new BigDecimal("1291.69"), resultado.getTotalMasCaro());
        // Ahorro total: 1291.69 - 970.00 = 321.69 (NO 1295 - 970 = 325)
        assertEquals(new BigDecimal("321.69"), resultado.getTotalAhorrado());

        assertEquals(1, resultado.getHojaDeRuta().size());
        assertEquals("Día", resultado.getHojaDeRuta().get(0).getSupermercadoNombre());
        assertEquals(new BigDecimal("970.00"), resultado.getHojaDeRuta().get(0).getSubtotalTienda());
    }

    @Test
    void generarCircuitoOptimo_cuandoListaVacia_debeLanzarExcepcion() {
        Long listaId = 5L;
        String userEmail = "test@ejemplo.com";

        ListaCompraDetalleDto detalleVacio = new ListaCompraDetalleDto(
                listaId,
                "ejemplo",
                LocalDateTime.now(),
                false,
                List.of(),
                BigDecimal.ZERO
        );

        when(listaCompraService.obtenerListaDetalle(listaId, userEmail)).thenReturn(detalleVacio);

        assertThrows(RuntimeException.class, () ->
                optimizacionService.generarCircuitoOptimo(listaId, userEmail)
        );
    }
}
