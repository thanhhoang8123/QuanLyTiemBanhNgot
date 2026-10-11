package com.nhom4.QuanLyTiemBanhNgot.dto.promotionproduct;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PromotionProductRequest(
        @NotNull(message = "Mã khuyến mãi không được để trống")
        @Positive(message = "Mã khuyến mãi phải là số dương")
        Long promotionId,

        @NotNull(message = "Mã sản phẩm không được để trống")
        @Positive(message = "Mã sản phẩm phải là số dương")
        Long productId
) {
}
