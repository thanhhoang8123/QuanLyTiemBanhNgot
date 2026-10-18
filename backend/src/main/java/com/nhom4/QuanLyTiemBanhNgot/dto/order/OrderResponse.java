package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderCode,
        Long customerId,
        Long employeeId,
        LocalDateTime orderDate,
        String deliveryAddress,
        String deliveryStatus,
        BigDecimal totalAmount,
        BigDecimal discountAmount,
        BigDecimal finalAmount,
        String status,
        LocalDateTime createdAt,
        List<OrderItemResponse> items,
        Long promotionId,
        String promotionCode,
        String note
) {
}
