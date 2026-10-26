package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import java.math.BigDecimal;

public record PosCatalogPriceResponse(
        Long productId,
        BigDecimal originalPrice,
        BigDecimal salePrice
) {
}
