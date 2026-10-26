package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Objects;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
public class ProductoBusquedaDto {
    private Long id;
    private String marca;
    private String nombreGenerico;
    private String categoria;
    private String pesoUnidad;
    private Double pesoValor;
    private String varianteEspecifica;
    private String urlEspecifica;
    private String supermercado;
    private String urlImagen;
    private BigDecimal precio;
    private java.util.List<ProductoTiendaOfertaDto> tiendas = new java.util.ArrayList<>();

    // Constructor completo con tiendas
    public ProductoBusquedaDto(Long id, String marca, String nombreGenerico, String categoria, String pesoUnidad, Double pesoValor,
                               String varianteEspecifica, String urlEspecifica, String supermercado, String urlImagen, BigDecimal precio,
                               java.util.List<ProductoTiendaOfertaDto> tiendas) {
        this.id = id;
        this.marca = marca;
        this.nombreGenerico = nombreGenerico;
        this.categoria = categoria;
        this.pesoUnidad = pesoUnidad;
        this.pesoValor = pesoValor;
        this.varianteEspecifica = varianteEspecifica;
        this.urlEspecifica = urlEspecifica;
        this.supermercado = supermercado;
        this.urlImagen = urlImagen;
        this.precio = precio;
        this.tiendas = tiendas != null ? tiendas : new java.util.ArrayList<>();
    }

    // Constructor de 11 argumentos para compatibilidad
    public ProductoBusquedaDto(Long id, String marca, String nombreGenerico, String categoria, String pesoUnidad, Double pesoValor,
                               String varianteEspecifica, String urlEspecifica, String supermercado, String urlImagen, BigDecimal precio) {
        this(id, marca, nombreGenerico, categoria, pesoUnidad, pesoValor, varianteEspecifica, urlEspecifica, supermercado, urlImagen, precio, new java.util.ArrayList<>());
    }

    // Constructor utilizado por la query de HEAD en HistorialPrecioRepository
    public ProductoBusquedaDto(Long id, String nombreGenerico, String marca, BigDecimal precio, String urlImagen, String supermercado) {
        this.id = id;
        this.nombreGenerico = nombreGenerico;
        this.marca = marca;
        this.precio = precio;
        this.urlImagen = urlImagen;
        this.supermercado = supermercado;
        this.tiendas = new java.util.ArrayList<>();
    }

    public static String buildNombreProducto(String nombreGenerico, String varianteEspecifica, Double pesoValor, String pesoUnidad) {
        String nombre = StreamJoiner.joinNonBlank(
                nombreGenerico,
                varianteEspecifica,
                formatPeso(pesoValor, pesoUnidad)
        );

        return nombre.isBlank() ? "Producto" : nombre;
    }

    private static String formatPeso(Double pesoValor, String pesoUnidad) {
        String unidad = (pesoUnidad == null || pesoUnidad.isBlank()) ? "" : pesoUnidad.trim();

        if (pesoValor == null || pesoValor == 0) {
            return unidad.isBlank() ? null : unidad;
        }

        String valorFormateado = (pesoValor % 1 == 0)
                ? String.valueOf(pesoValor.longValue())
                : String.valueOf(pesoValor);

        if (unidad.isBlank()) {
            return valorFormateado;
        }

        return valorFormateado + " " + unidad;
    }

    private static class StreamJoiner {
        private static String joinNonBlank(String... parts) {
            return Arrays.stream(parts)
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(part -> !part.isEmpty())
                    .collect(Collectors.joining(" "));
        }
    }
}

