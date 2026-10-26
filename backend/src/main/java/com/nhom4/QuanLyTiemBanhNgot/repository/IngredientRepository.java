package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    @Query(value = "SELECT * FROM ingredients WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<Ingredient> findByIdForUpdate(@Param("id") Long id);

    @Query(value = "SELECT * FROM ingredients WHERE id IN (:ids) ORDER BY id FOR UPDATE", nativeQuery = true)
    List<Ingredient> findAllByIdForUpdate(@Param("ids") List<Long> ids);
}