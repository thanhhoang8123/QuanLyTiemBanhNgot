package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateOrderRequest(
        @NotNull(message = "customerId là bắt buộc")
        @Positive(message = "customerId phải lớn hơn 0")
        Long customerId,

        @NotNull(message = "employeeId là bắt buộc")
        @Positive(message = "employeeId phải lớn hơn 0")
        Long employeeId,

        @Size(max = 255, message = "Địa chỉ giao hàng không được vượt quá 255 ký tự")
        String deliveryAddress,

        @NotEmpty(message = "Đơn hàng phải có ít nhất một dòng sản phẩm")
        List<@NotNull @Valid CreateOrderItemRequest> items,

        @Size(max = 30, message = "Mã khuyến mãi không được vượt quá 30 ký tự")
        String promotionCode,

        @Size(max = 500, message = "Ghi chú đơn hàng không được vượt quá 500 ký tự")
        String note
) {
    public CreateOrderRequest(
            Long customerId,
            Long employeeId,
            String deliveryAddress,
            List<CreateOrderItemRequest> items) {
        this(customerId, employeeId, deliveryAddress, items, null, null);
    }
}
