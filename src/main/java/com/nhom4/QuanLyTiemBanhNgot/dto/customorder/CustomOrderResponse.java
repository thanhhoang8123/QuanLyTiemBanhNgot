package com.nhom4.QuanLyTiemBanhNgot.dto.customorder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomOrderResponse(
        Long id,
        Long customerId,
        Long employeeId,
        String cakeName,
        String requestDescription,
        LocalDateTime orderDate,
        LocalDateTime deliveryDate,
        BigDecimal estimatedPrice,
        BigDecimal deposit,
        String status
) {
}
