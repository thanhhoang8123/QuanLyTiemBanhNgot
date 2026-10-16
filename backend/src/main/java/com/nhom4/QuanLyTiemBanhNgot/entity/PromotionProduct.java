package com.nhom4.QuanLyTiemBanhNgot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity đại diện cho bảng promotion_products.
 *
 * Đây là bảng trung gian giữa:
 * - promotions
 * - products
 *
 * Một promotion có thể áp dụng cho nhiều product.
 * Một product cũng có thể thuộc nhiều promotion.
 */
@Entity
@Table(name = "promotion_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PromotionProduct {

    /**
     * Khóa chính ghép:
     * promotion_id + product_id
     */
    @EmbeddedId
    private PromotionProductId id;

    /**
     * Quan hệ với bảng promotions.
     *
     * @MapsId("promotionId") nghĩa là:
     * promotion.id được dùng làm promotionId
     * trong khóa chính ghép.
     */
    @ManyToOne
    @MapsId("promotionId")
    @JoinColumn(name = "promotion_id")
    private Promotion promotion;

    /**
     * Quan hệ với bảng products.
     *
     * @MapsId("productId") nghĩa là:
     * product.id được dùng làm productId
     * trong khóa chính ghép.
     */
    @ManyToOne
    @MapsId("productId")
    @JoinColumn(name = "product_id")
    private Product product;
}