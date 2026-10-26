package com.tesis.demo.service;

import com.tesis.demo.dto.HistorialPrecioDto;
import com.tesis.demo.dto.ItemListaDto;
import com.tesis.demo.dto.ListaCompraDetalleDto;
import com.tesis.demo.model.ListaCompra;
import com.tesis.demo.model.Usuario;
import com.tesis.demo.repository.ItemListaRepository;
import com.tesis.demo.repository.ListaCompraRepository;
import com.tesis.demo.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListaCompraServiceImplTest {

    @Mock
    private ListaCompraRepository listaCompraRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ItemListaRepository itemListaRepository;

    @Mock
    private ItemListaService itemListaService;

    @Mock
    private HistorialPrecioService historialPrecioService;

    @InjectMocks
    private ListaCompraServiceImpl listaCompraService;

    private Usuario usuario;
    private ListaCompra listaCompra;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmail("test@ejemplo.com");

        listaCompra = new ListaCompra();
        listaCompra.setId(5L);
        listaCompra.setNombreLista("Mi Lista");
        listaCompra.setFechaCreacion(LocalDateTime.now());
        listaCompra.setFavorita(false);
        listaCompra.setUsuario(usuario);
    }

    @Test
    void obtenerListaDetalle_debeRespetarSupermercadoYPrecioDelItem() {
        when(listaCompraRepository.findById(5L)).thenReturn(Optional.of(listaCompra));

        // Item agregado originalmente en Comodín en Casa (id=1, precio=1291.69)
        ItemListaDto itemDto = new ItemListaDto(
                19L,
                5L,
                60L,
                "Picadillo",
                "Swift",
                1,
                1L,
                "Comodín en Casa"
        );
        when(itemListaService.listarItems(5L, "test@ejemplo.com")).thenReturn(List.of(itemDto));

        HistorialPrecioDto precioComodin = new HistorialPrecioDto(
                100L,
                55L,
                60L,
                "Picadillo",
                1L,
                "Comodín en Casa",
                BigDecimal.valueOf(1291.69),
                LocalDateTime.now()
        );
        when(historialPrecioService.obtenerUltimoPorProductoYSupermercado(60L, 1L))
                .thenReturn(Optional.of(precioComodin));

        ListaCompraDetalleDto detalle = listaCompraService.obtenerListaDetalle(5L, "test@ejemplo.com");

        assertNotNull(detalle);
        assertEquals(1, detalle.getItems().size());

        var itemConPrecio = detalle.getItems().get(0);
        assertEquals("Picadillo", itemConPrecio.getProductoNombre());
        assertEquals("Comodín en Casa", itemConPrecio.getSupermercadoNombre());
        assertEquals(1L, itemConPrecio.getSupermercadoId());
        assertEquals(BigDecimal.valueOf(1291.69), itemConPrecio.getPrecioUnitario());
        assertEquals(BigDecimal.valueOf(1291.69), itemConPrecio.getPrecioTotal());
        assertEquals(BigDecimal.valueOf(1291.69), detalle.getTotalEstimado());

        verify(historialPrecioService).obtenerUltimoPorProductoYSupermercado(60L, 1L);
    }
}
