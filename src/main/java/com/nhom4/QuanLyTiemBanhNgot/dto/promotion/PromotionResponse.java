package com.nhom4.QuanLyTiemBanhNgot.dto.promotion;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PromotionResponse(
        Long id,
        String promotionCode,
        String name,
        BigDecimal discountPercent,
        BigDecimal maxDiscount,
        BigDecimal minOrderValue,
        LocalDate startDate,
        LocalDate endDate,
        Boolean status
) {
}
