package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ItemListaDto {
    private Long id;
    private Long listaId;
    private Long productoId;
    private String productoNombre;
    private String marca;
    private Integer cantidad;
    private Long supermercadoId;
    private String supermercadoNombre;
    private String varianteEspecifica;
    private Double pesoValor;
    private String pesoUnidad;
    private String urlImagen;

    public ItemListaDto(Long id, Long listaId, Long productoId, String productoNombre, String marca,
                        Integer cantidad, Long supermercadoId, String supermercadoNombre) {
        this.id = id;
        this.listaId = listaId;
        this.productoId = productoId;
        this.productoNombre = productoNombre;
        this.marca = marca;
        this.cantidad = cantidad;
        this.supermercadoId = supermercadoId;
        this.supermercadoNombre = supermercadoNombre;
    }
}
