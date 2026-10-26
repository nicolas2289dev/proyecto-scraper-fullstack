package com.tesis.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "productos", uniqueConstraints = {
        @UniqueConstraint(name = "uk_productos_ean", columnNames = "ean"),
        @UniqueConstraint(name = "uk_productos_categoria_clave", columnNames = {"categoria_id", "clave_normalizada"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nombre genérico del producto, derivado del término de búsqueda del criterio.
     * Ejemplo: "Fideo", "Arroz", "Azúcar".
     */
    @Column(name = "nombre_generico", nullable = false, length = 255)
    private String nombreGenerico;

    /**
     * Marca comercial del producto.
     * Ejemplo: "Lucchetti", "Cañuelas".
     */
    @Column(length = 150)
    private String marca;

    /**
     * Variante específica del producto (tipo, formato, presentación).
     * Ejemplo: "Spaghetti", "Mostachol", "Integral", "Doble Cero".
     */
    @Column(name = "variante_especifica", length = 255)
    private String varianteEspecifica;

    /**
     * Valor numérico del peso o volumen del producto.
     * Ejemplo: 500.0 (para 500g), 1.0 (para 1kg).
     */
    @Column(name = "peso_valor")
    private Double pesoValor;

    /**
     * Unidad normalizada del peso o volumen.
     * Valores posibles: "g", "kg", "ml", "l".
     */
    @Column(name = "peso_unidad", length = 10)
    private String pesoUnidad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    /**
     * Código de barras (EAN/GTIN) del producto físico. Es idéntico entre supermercados,
     * por lo que es el criterio de unificación más fiable. Puede ser null.
     */
    @Column(length = 20)
    private String ean;

    /**
     * Huella determinista del producto (nombre, marca, peso canónico y variante ordenada).
     * Se usa para unificar productos cuando no hay EAN. Puede ser null en productos manuales.
     */
    @Column(name = "clave_normalizada", length = 400)
    private String claveNormalizada;
}
