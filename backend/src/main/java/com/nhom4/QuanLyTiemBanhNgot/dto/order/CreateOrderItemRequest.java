package com.nhom4.QuanLyTiemBanhNgot.dto.order;

public record CreateOrderItemRequest(
        Long productId,
        Integer quantity
) {
}
