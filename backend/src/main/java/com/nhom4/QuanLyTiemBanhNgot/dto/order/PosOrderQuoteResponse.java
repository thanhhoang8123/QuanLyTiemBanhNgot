package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import java.math.BigDecimal;
import java.util.List;

public record PosOrderQuoteResponse(
        BigDecimal totalAmount,
        BigDecimal productDiscountAmount,
        BigDecimal subtotalAfterPromotions,
        Integer loyaltyPointsToRedeem,
        BigDecimal loyaltyDiscountAmount,
        BigDecimal finalAmount,
        List<PosOrderQuoteItemResponse> items,
        List<PosCatalogPriceResponse> catalogPrices
) {
}
