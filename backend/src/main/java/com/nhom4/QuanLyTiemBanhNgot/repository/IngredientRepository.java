package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.Ingredient;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select ingredient from Ingredient ingredient where ingredient.id in :ids order by ingredient.id")
    List<Ingredient> findAllByIdForUpdate(@Param("ids") List<Long> ids);
}