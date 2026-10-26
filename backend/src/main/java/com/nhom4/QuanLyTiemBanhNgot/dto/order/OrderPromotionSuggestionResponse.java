package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import java.math.BigDecimal;

public record OrderPromotionSuggestionResponse(
        Long promotionId,
        String promotionCode,
        String name,
        BigDecimal discountPercent,
        BigDecimal maxDiscount,
        BigDecimal minOrderValue,
        boolean eligible,
        BigDecimal discountAmount,
        BigDecimal finalAmount,
        String message
) {
}
