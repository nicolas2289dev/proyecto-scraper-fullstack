package com.tesis.demo.service;

import com.tesis.demo.dto.ProductoBusquedaDto;
import com.tesis.demo.dto.ProductoTiendaOfertaDto;
import com.tesis.demo.model.Categoria;
import com.tesis.demo.model.Producto;
import com.tesis.demo.repository.CategoriaRepository;
import com.tesis.demo.repository.HistorialPrecioRepository;
import com.tesis.demo.repository.ItemListaRepository;
import com.tesis.demo.repository.ProductoRepository;
import com.tesis.demo.repository.ProductoTiendaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductoServiceBuscarConPreciosTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private HistorialPrecioRepository historialPrecioRepository;

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private ProductoTiendaRepository productoTiendaRepository;

    @Mock
    private ItemListaRepository itemListaRepository;

    @InjectMocks
    private ProductoServiceImpl productoService;

    private Producto productoMaestro;

    @BeforeEach
    void setUp() {
        Categoria cat = new Categoria();
        cat.setId(1L);
        cat.setNombre("Alimento");

        productoMaestro = new Producto();
        productoMaestro.setId(60L);
        productoMaestro.setNombreGenerico("Picadillo");
        productoMaestro.setMarca("Swift");
        productoMaestro.setVarianteEspecifica("Carne");
        productoMaestro.setPesoValor(90.0);
        productoMaestro.setPesoUnidad("g");
        productoMaestro.setCategoria(cat);
    }

    @Test
    void buscarConPrecios_debeUnificarEnUnSoloProductoMaestroConMultiplesTiendas() {
        Page<Producto> productosPage = new PageImpl<>(List.of(productoMaestro), PageRequest.of(0, 12), 1);
        when(productoRepository.buscarProductosMaestrosPorDefecto(isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(productosPage);

        List<ProductoTiendaOfertaDto> ofertas = List.of(
                new ProductoTiendaOfertaDto(60L, 2L, "Día Online", new BigDecimal("1100.00"), "img-dia.jpg", "url-dia"),
                new ProductoTiendaOfertaDto(60L, 1L, "Comodín en Casa", new BigDecimal("1291.69"), "img-comodin.jpg", "url-comodin"),
                new ProductoTiendaOfertaDto(60L, 3L, "Vea", new BigDecimal("1295.00"), "img-vea.jpg", "url-vea")
        );
        when(historialPrecioRepository.obtenerOfertasPorProductoIds(List.of(60L))).thenReturn(ofertas);

        Page<ProductoBusquedaDto> resultado = productoService.buscarConPrecios(null, null, null, PageRequest.of(0, 12));

        assertNotNull(resultado);
        assertEquals(1, resultado.getContent().size(), "Debe retornar una única tarjeta por producto maestro");

        ProductoBusquedaDto dto = resultado.getContent().get(0);
        assertEquals(60L, dto.getId());
        assertEquals("Swift", dto.getMarca());
        assertEquals("Picadillo", dto.getNombreGenerico());
        assertEquals(3, dto.getTiendas().size(), "Debe contener las 3 tiendas donde está disponible");

        assertEquals(2L, dto.getTiendas().get(0).getSupermercadoId());
        assertEquals("Día Online", dto.getTiendas().get(0).getSupermercadoNombre());
        assertEquals(new BigDecimal("1100.00"), dto.getTiendas().get(0).getPrecio());

        assertEquals(1L, dto.getTiendas().get(1).getSupermercadoId());
        assertEquals("Comodín en Casa", dto.getTiendas().get(1).getSupermercadoNombre());

        assertEquals(3L, dto.getTiendas().get(2).getSupermercadoId());
        assertEquals("Vea", dto.getTiendas().get(2).getSupermercadoNombre());
    }

    @Test
    void buscarConPrecios_ordenPrecioAscendente_debeUsarMetodoPrecioAsc() {
        Page<Producto> productosPage = new PageImpl<>(List.of(productoMaestro), PageRequest.of(0, 12), 1);
        when(productoRepository.buscarProductosMaestrosPrecioAsc(eq("picadillo"), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(productosPage);
        when(historialPrecioRepository.obtenerOfertasPorProductoIds(anyList())).thenReturn(List.of());

        Pageable pageableAsc = PageRequest.of(0, 12, Sort.by(Sort.Direction.ASC, "precio"));
        Page<ProductoBusquedaDto> resultado = productoService.buscarConPrecios("picadillo", null, null, pageableAsc);

        assertNotNull(resultado);
        verify(productoRepository).buscarProductosMaestrosPrecioAsc(eq("picadillo"), isNull(), isNull(), any(Pageable.class));
        verify(productoRepository, never()).buscarProductosMaestrosPrecioDesc(any(), any(), any(), any());
        verify(productoRepository, never()).buscarProductosMaestrosPorDefecto(any(), any(), any(), any());
    }

    @Test
    void buscarConPrecios_ordenPrecioDescendente_debeUsarMetodoPrecioDesc() {
        Page<Producto> productosPage = new PageImpl<>(List.of(productoMaestro), PageRequest.of(0, 12), 1);
        when(productoRepository.buscarProductosMaestrosPrecioDesc(isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(productosPage);
        when(historialPrecioRepository.obtenerOfertasPorProductoIds(anyList())).thenReturn(List.of());

        Pageable pageableDesc = PageRequest.of(0, 12, Sort.by(Sort.Direction.DESC, "precio"));
        Page<ProductoBusquedaDto> resultado = productoService.buscarConPrecios(null, null, null, pageableDesc);

        assertNotNull(resultado);
        verify(productoRepository).buscarProductosMaestrosPrecioDesc(isNull(), isNull(), isNull(), any(Pageable.class));
        verify(productoRepository, never()).buscarProductosMaestrosPrecioAsc(any(), any(), any(), any());
        verify(productoRepository, never()).buscarProductosMaestrosPorDefecto(any(), any(), any(), any());
    }
}
