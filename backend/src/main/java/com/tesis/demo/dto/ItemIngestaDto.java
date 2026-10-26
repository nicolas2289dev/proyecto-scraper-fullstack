package com.tesis.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO que representa un único ítem descubierto por el scraper en la grilla
 * de resultados de un supermercado, enviado al endpoint de ingesta masiva.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ItemIngestaDto {

    /**
     * Texto tal como aparece en la tarjeta del producto en el supermercado.
     * Ejemplo: "Fideos Spaghetti Lucchetti x 500 gramos".
     */
    @NotBlank(message = "El texto crudo de tienda es obligatorio")
    private String textoCrudoTienda;

    /**
     * URL absoluta o relativa de la página del producto en la tienda.
     * Ejemplo: "https://supermercado.com.ar/fideo-lucchetti/p".
     */
    @NotBlank(message = "La URL específica del producto es obligatoria")
    private String urlEspecifica;

    /**
     * Precio renderizado en la grilla al momento del scraping.
     * Puede ser null si la tarjeta no muestra precio (ej: precio sujeto a cambio).
     */
    private BigDecimal precioActual;

    /** Indica si el producto estaba disponible (en stock) al momento del scraping. */
    private boolean disponibilidad;

    /** ID del supermercado donde fue descubierto el producto. */
    @NotNull(message = "El supermercado es obligatorio")
    private Long supermercadoId;

    /**
     * Término de búsqueda original que generó este resultado.
     * Usado como ancla para determinar el nombreGenerico del producto maestro.
     * Ejemplo: "fideo".
     */
    @NotBlank(message = "La palabra clave buscada es obligatoria")
    private String palabraClaveBuscada;

    /**
     * URL de la imagen del producto en la tienda específica.
     * Ejemplo: "https://supermercado.com.ar/imagenes/fideo.jpg".
     * Puede ser null si el scraper no encontró imagen.
     */
    private String urlImagen;

    /**
     * Código de barras EAN/GTIN informado por la tienda. Opcional pero es el criterio
     * de unificación más fiable entre supermercados.
     */
    private String ean;

    /**
     * Marca informada por la tienda (ej: campo {@code brand} de VTEX). Opcional.
     * Evita inferir la marca desde el orden de las palabras del título.
     */
    private String marcaTienda;

    /** Peso/volumen pre-parseado por el scraper. Se usa solo si el backend no logra extraerlo del título. */
    private Double pesoValor;

    /** Unidad del peso/volumen pre-parseado por el scraper (g, kg, ml, l). */
    private String pesoUnidad;
}
