package com.tesis.demo.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Diccionario de marcas comerciales conocidas.
 *
 * <p>Lo consume el {@code NormalizacionService} para detectar la marca dentro de un título
 * de tienda sin depender del orden de las palabras. Se autoalimenta con la marca que
 * informan las tiendas (campo {@code brand} de VTEX) durante la ingesta.</p>
 */
@Entity
@Table(name = "marcas", uniqueConstraints = @UniqueConstraint(name = "uk_marcas_nombre", columnNames = "nombre"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Marca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nombre canónico de la marca, en formato título. Ej: "Swift", "La Blanca". */
    @Column(nullable = false, length = 150)
    private String nombre;
}
