package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProduct;
import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProductId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

/**
 * Repository thao tác với bảng promotion_products.
 *
 * Vì bảng sử dụng khóa chính ghép nên:
 *
 * JpaRepository<PromotionProduct, PromotionProductId>
 *
 * PromotionProduct = Entity
 * PromotionProductId = kiểu khóa chính
 */
public interface PromotionProductRepository
        extends JpaRepository<PromotionProduct, PromotionProductId> {

    boolean existsByIdPromotionId(Long promotionId);

    List<PromotionProduct> findByProduct_Id(Long productId);

    List<PromotionProduct> findByPromotion_IdAndProduct_IdIn(
            Long promotionId,
            Collection<Long> productIds
    );
}