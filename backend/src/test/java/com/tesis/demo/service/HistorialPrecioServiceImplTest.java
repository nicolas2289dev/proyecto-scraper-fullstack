package com.tesis.demo.service;

import com.tesis.demo.dto.HistorialPrecioDto;
import com.tesis.demo.model.HistorialPrecio;
import com.tesis.demo.model.Producto;
import com.tesis.demo.model.ProductoTienda;
import com.tesis.demo.model.Supermercado;
import com.tesis.demo.repository.HistorialPrecioRepository;
import com.tesis.demo.repository.ProductoTiendaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HistorialPrecioServiceImplTest {

    @Mock
    private HistorialPrecioRepository historialPrecioRepository;

    @Mock
    private ProductoTiendaRepository productoTiendaRepository;

    @InjectMocks
    private HistorialPrecioServiceImpl historialPrecioService;

    @Test
    void obtenerUltimoPorProductoYSupermercado_debeRetornarPrecioDelSupermercadoSolicitado() {
        Long productoId = 60L;
        Long comodinId = 1L;

        Producto producto = new Producto();
        producto.setId(productoId);
        producto.setNombreGenerico("Picadillo");
        producto.setMarca("Swift");

        Supermercado superComodin = new Supermercado();
        superComodin.setId(comodinId);
        superComodin.setNombre("Comodín en Casa");

        ProductoTienda ptComodin = new ProductoTienda();
        ptComodin.setId(10L);
        ptComodin.setProducto(producto);
        ptComodin.setSupermercado(superComodin);

        HistorialPrecio hpComodin = new HistorialPrecio();
        hpComodin.setId(100L);
        hpComodin.setProductoTienda(ptComodin);
        hpComodin.setPrecio(BigDecimal.valueOf(1291.69));
        hpComodin.setFechaRecoleccion(LocalDateTime.now().minusHours(2));

        when(productoTiendaRepository.findByProductoIdAndSupermercadoId(productoId, comodinId))
                .thenReturn(Optional.of(ptComodin));
        when(historialPrecioRepository.findTopByProductoTiendaIdOrderByFechaRecoleccionDesc(10L))
                .thenReturn(Optional.of(hpComodin));

        Optional<HistorialPrecioDto> resultado = historialPrecioService.obtenerUltimoPorProductoYSupermercado(productoId, comodinId);

        assertTrue(resultado.isPresent());
        assertEquals(BigDecimal.valueOf(1291.69), resultado.get().getPrecio());
        assertEquals("Comodín en Casa", resultado.get().getSupermercadoNombre());
        assertEquals(comodinId, resultado.get().getSupermercadoId());

        verify(productoTiendaRepository).findByProductoIdAndSupermercadoId(productoId, comodinId);
        verify(historialPrecioRepository).findTopByProductoTiendaIdOrderByFechaRecoleccionDesc(10L);
    }
}
