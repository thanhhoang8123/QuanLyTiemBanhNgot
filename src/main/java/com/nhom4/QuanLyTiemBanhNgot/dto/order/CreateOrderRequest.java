package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import java.util.List;

public record CreateOrderRequest(
        Long customerId,
        Long employeeId,
        String deliveryAddress,
        List<CreateOrderItemRequest> items
) {
}
