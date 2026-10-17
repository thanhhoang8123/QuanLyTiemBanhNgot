package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateOrderItemRequest(
        @NotNull(message = "productId là bắt buộc")
        @Positive(message = "productId phải lớn hơn 0")
        Long productId,

        @NotNull(message = "Số lượng sản phẩm là bắt buộc")
        @Positive(message = "Số lượng sản phẩm phải lớn hơn 0")
        Integer quantity
) {
}
