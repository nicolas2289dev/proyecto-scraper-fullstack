package com.tesis.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "productos_tienda", uniqueConstraints =
        @UniqueConstraint(name = "uk_productos_tienda_producto_super", columnNames = {"producto_id", "supermercado_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductoTienda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supermercado_id", nullable = false)
    private Supermercado supermercado;

    @Column(name = "url_especifica", columnDefinition = "TEXT")
    private String urlEspecifica;

    @Column(name = "url_imagen", columnDefinition = "TEXT")
    private String urlImagen;
}
