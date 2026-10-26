package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PosOrderQuoteRequest(
        @Size(max = 500, message = "Giỏ hàng vượt quá số dòng cho phép")
        List<@NotNull @Valid CreateOrderItemRequest> items,

        @Size(max = 500, message = "Danh sách sản phẩm vượt quá giới hạn")
        List<@NotNull @Positive Long> productIds,

        @Positive(message = "Mã khách hàng phải lớn hơn 0")
        Long customerId,

        @PositiveOrZero(message = "Số điểm sử dụng không được âm")
        Integer loyaltyPointsToRedeem
) {
}
