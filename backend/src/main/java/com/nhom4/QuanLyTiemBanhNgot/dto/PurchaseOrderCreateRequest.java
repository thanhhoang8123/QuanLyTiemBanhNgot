
package com.nhom4.QuanLyTiemBanhNgot.dto;

import java.math.BigDecimal;
import java.util.List;

public record PurchaseOrderCreateRequest(
        Long supplierId,
        Long employeeId,
        List<PurchaseOrderItemRequest> items
) {
    public record PurchaseOrderItemRequest(
            Long ingredientId,
            BigDecimal quantity,
            BigDecimal unitCost
    ) {
    }
}