package com.tesis.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SucursalDto {
    private Long id;

    @NotNull(message = "El ID del supermercado es obligatorio")
    private Long supermercadoId;

    private String supermercadoNombre;

    @NotBlank(message = "El nombre de la sucursal es obligatorio")
    private String nombreSucursal;

    @NotBlank(message = "La dirección de la sucursal es obligatoria")
    private String direccion;

    @NotBlank(message = "La ciudad es obligatoria")
    private String ciudad;

    @NotNull(message = "La latitud es obligatoria")
    private Double latitud;

    @NotNull(message = "La longitud es obligatoria")
    private Double longitud;
}

