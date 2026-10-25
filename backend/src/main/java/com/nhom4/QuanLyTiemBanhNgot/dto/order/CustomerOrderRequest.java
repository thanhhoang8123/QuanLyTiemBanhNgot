package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CustomerOrderRequest(
        @Size(max = 255, message = "Địa chỉ giao hàng không được vượt quá 255 ký tự")
        String deliveryAddress,

        @NotEmpty(message = "Đơn hàng phải có ít nhất một dòng sản phẩm")
        List<@Valid CreateOrderItemRequest> items,

        @Size(max = 30, message = "Mã khuyến mãi không được vượt quá 30 ký tự")
        String promotionCode,

        @Size(max = 500, message = "Ghi chú đơn hàng không được vượt quá 500 ký tự")
        String note
) {
}
