package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProduct;
import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProductId;
import org.springframework.data.jpa.repository.JpaRepository;

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

}