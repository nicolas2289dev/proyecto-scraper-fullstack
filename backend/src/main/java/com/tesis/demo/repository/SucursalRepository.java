package com.tesis.demo.repository;

import com.tesis.demo.model.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SucursalRepository extends JpaRepository<Sucursal, Long> {

    @Query("SELECT s FROM Sucursal s JOIN FETCH s.supermercado ORDER BY s.supermercado.nombre ASC, s.nombreSucursal ASC")
    List<Sucursal> findAllWithSupermercado();

    @Query("SELECT s FROM Sucursal s JOIN FETCH s.supermercado WHERE s.supermercado.id = :supermercadoId ORDER BY s.nombreSucursal ASC")
    List<Sucursal> findBySupermercadoIdWithSupermercado(@Param("supermercadoId") Long supermercadoId);

    Optional<Sucursal> findBySupermercadoIdAndNombreSucursalIgnoreCase(Long supermercadoId, String nombreSucursal);
}

