package com.tesis.demo.repository;

import com.tesis.demo.model.Marca;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MarcaRepository extends JpaRepository<Marca, Long> {

    Optional<Marca> findByNombreIgnoreCase(String nombre);
}
