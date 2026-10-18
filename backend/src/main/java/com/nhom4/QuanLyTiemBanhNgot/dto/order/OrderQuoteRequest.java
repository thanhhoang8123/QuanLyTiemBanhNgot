package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record OrderQuoteRequest(
        @NotEmpty(message = "Đơn hàng phải có ít nhất một dòng sản phẩm")
        List<@NotNull @Valid CreateOrderItemRequest> items,

        @Size(max = 30, message = "Mã khuyến mãi không được vượt quá 30 ký tự")
        String promotionCode
) {
}
