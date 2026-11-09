package com.tesis.demo.service;

import com.tesis.demo.dto.SucursalDto;
import com.tesis.demo.model.Sucursal;
import com.tesis.demo.repository.SucursalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SucursalServiceImpl implements SucursalService {

    private static final Logger log = LoggerFactory.getLogger(SucursalServiceImpl.class);

    private final SucursalRepository sucursalRepository;

    public SucursalServiceImpl(SucursalRepository sucursalRepository) {
        this.sucursalRepository = sucursalRepository;
    }

    @Override
    public List<SucursalDto> findAll(Long supermercadoId) {
        List<Sucursal> sucursales;
        if (supermercadoId != null) {
            log.debug("Consultando sucursales para supermercadoId={}", supermercadoId);
            sucursales = sucursalRepository.findBySupermercadoIdWithSupermercado(supermercadoId);
        } else {
            log.debug("Consultando listado completo de sucursales");
            sucursales = sucursalRepository.findAllWithSupermercado();
        }
        return sucursales.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private SucursalDto mapToDto(Sucursal sucursal) {
        return SucursalDto.builder()
                .id(sucursal.getId())
                .supermercadoId(sucursal.getSupermercado().getId())
                .supermercadoNombre(sucursal.getSupermercado().getNombre())
                .nombreSucursal(sucursal.getNombreSucursal())
                .direccion(sucursal.getDireccion())
                .ciudad(sucursal.getCiudad())
                .latitud(sucursal.getLatitud())
                .longitud(sucursal.getLongitud())
                .build();
    }
}

