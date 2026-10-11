package com.nhom4.QuanLyTiemBanhNgot.repository;



import com.nhom4.QuanLyTiemBanhNgot.entity.Promotion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;



public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    boolean existsByPromotionCodeIgnoreCase(String promotionCode);

    boolean existsByPromotionCodeIgnoreCaseAndIdNot(String promotionCode, Long id);

    List<Promotion> findByPromotionCodeContainingIgnoreCaseOrNameContainingIgnoreCase(
            String promotionCodeKeyword,
            String nameKeyword
    );
}