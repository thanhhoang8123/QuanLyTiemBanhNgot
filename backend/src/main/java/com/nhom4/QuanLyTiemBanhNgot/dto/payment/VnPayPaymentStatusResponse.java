package com.nhom4.QuanLyTiemBanhNgot.dto.payment;

import java.time.LocalDateTime;

public record VnPayPaymentStatusResponse(
        Long orderId,
        String orderStatus,
        String paymentStatus,
        LocalDateTime paidAt,
        String attemptStatus,
        LocalDateTime updatedAt
) {
}
