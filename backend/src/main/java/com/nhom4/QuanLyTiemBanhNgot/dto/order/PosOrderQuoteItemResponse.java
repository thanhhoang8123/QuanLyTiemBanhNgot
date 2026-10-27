package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import java.math.BigDecimal;

public record PosOrderQuoteItemResponse(
        Long productId,
        String productName,
        Integer quantity,
        BigDecimal originalUnitPrice,
        BigDecimal effectiveUnitPrice,
        BigDecimal productDiscountAmount,
        BigDecimal lineTotal
) {
}
