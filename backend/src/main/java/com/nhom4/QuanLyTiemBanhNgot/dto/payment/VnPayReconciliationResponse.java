package com.nhom4.QuanLyTiemBanhNgot.dto.payment;

public record VnPayReconciliationResponse(
        VnPayPaymentStatusResponse payment,
        String message
) {
}
