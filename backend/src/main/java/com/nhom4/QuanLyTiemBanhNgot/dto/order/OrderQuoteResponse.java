package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import java.math.BigDecimal;
import java.util.List;

public record OrderQuoteResponse(
        BigDecimal totalAmount,
        BigDecimal discountAmount,
        BigDecimal finalAmount,
        String promotionCode,
        List<OrderQuoteItemResponse> items
) {
}
