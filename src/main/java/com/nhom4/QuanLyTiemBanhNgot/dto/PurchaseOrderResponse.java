
package com.nhom4.QuanLyTiemBanhNgot.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PurchaseOrderResponse(
        Long id,
        String purchaseCode,
        Long supplierId,
        String supplierName,
        Long employeeId,
        LocalDateTime orderDate,
        String status,
        BigDecimal totalAmount,
        List<ItemResponse> items
) {
    public record ItemResponse(
            Long ingredientId,
            String ingredientName,
            BigDecimal quantity,
            BigDecimal unitCost,
            BigDecimal lineTotal
    ) {
    }
}