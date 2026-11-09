package com.tesis.demo.service;

import com.tesis.demo.dto.SucursalDto;
import java.util.List;

public interface SucursalService {
    List<SucursalDto> findAll(Long supermercadoId);
}

