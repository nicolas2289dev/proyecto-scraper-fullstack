package com.tesis.demo.service;

import com.tesis.demo.dto.SucursalDto;
import com.tesis.demo.model.Sucursal;
import com.tesis.demo.model.Supermercado;
import com.tesis.demo.repository.SucursalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SucursalServiceImplTest {

    @Mock
    private SucursalRepository sucursalRepository;

    @InjectMocks
    private SucursalServiceImpl sucursalService;

    private Supermercado dia;
    private Supermercado comodin;
    private Sucursal sucursalDiaCentro;
    private Sucursal sucursalComodinAlberdi;

    @BeforeEach
    void setUp() {
        dia = new Supermercado(1L, "Día", "https://diaonline.supermercadosdia.com.ar");
        comodin = new Supermercado(2L, "Comodín en Casa", "https://www.comodinencasa.com.ar");

        sucursalDiaCentro = Sucursal.builder()
                .id(10L)
                .supermercado(dia)
                .nombreSucursal("Día Belgrano Centro")
                .direccion("Av. Gral. Belgrano 850")
                .ciudad("San Salvador de Jujuy")
                .latitud(-24.1856)
                .longitud(-65.3022)
                .build();

        sucursalComodinAlberdi = Sucursal.builder()
                .id(20L)
                .supermercado(comodin)
                .nombreSucursal("Comodín Sucursal Alberdi")
                .direccion("Alberdi 164")
                .ciudad("San Salvador de Jujuy")
                .latitud(-24.1881)
                .longitud(-65.3065)
                .build();
    }

    @Test
    void findAll_sinFiltro_debeRetornarTodasLasSucursalesMapeadas() {
        when(sucursalRepository.findAllWithSupermercado())
                .thenReturn(List.of(sucursalComodinAlberdi, sucursalDiaCentro));

        List<SucursalDto> resultado = sucursalService.findAll(null);

        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        assertEquals("Comodín Sucursal Alberdi", resultado.get(0).getNombreSucursal());
        assertEquals(2L, resultado.get(0).getSupermercadoId());
        assertEquals("Día Belgrano Centro", resultado.get(1).getNombreSucursal());
        assertEquals(-24.1856, resultado.get(1).getLatitud());
        verify(sucursalRepository).findAllWithSupermercado();
        verify(sucursalRepository, never()).findBySupermercadoIdWithSupermercado(any());
    }

    @Test
    void findAll_conSupermercadoId_debeRetornarSucursalesFiltradas() {
        when(sucursalRepository.findBySupermercadoIdWithSupermercado(1L))
                .thenReturn(List.of(sucursalDiaCentro));

        List<SucursalDto> resultado = sucursalService.findAll(1L);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        assertEquals("Día Belgrano Centro", resultado.get(0).getNombreSucursal());
        assertEquals("Día", resultado.get(0).getSupermercadoNombre());
        verify(sucursalRepository).findBySupermercadoIdWithSupermercado(1L);
        verify(sucursalRepository, never()).findAllWithSupermercado();
    }
}

