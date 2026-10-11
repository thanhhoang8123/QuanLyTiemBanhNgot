package com.nhom4.QuanLyTiemBanhNgot.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Class đại diện cho khóa chính ghép của bảng promotion_products.
 *
 * Khóa chính gồm 2 cột:
 * - promotion_id
 * - product_id
 *
 * Ví dụ:
 * promotion_id = 1
 * product_id = 5
 *
 * => Đây là một khóa duy nhất của bảng.
 */
@Embeddable
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class PromotionProductId implements Serializable {

    // ID của chương trình khuyến mãi
    private Long promotionId;

    // ID của sản phẩm
    private Long productId;
}