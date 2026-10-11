package com.nhom4.QuanLyTiemBanhNgot.dto.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long orderId,
        BigDecimal amount,
        String paymentMethod,
        String status,
        String transactionId,
        String provider,
        LocalDateTime paidAt
) {
}
