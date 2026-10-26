package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoTiendaOfertaDto {
    private Long productoId;
    private Long supermercadoId;
    private String supermercadoNombre;
    private BigDecimal precio;
    private String urlImagen;
    private String urlEspecifica;
}
