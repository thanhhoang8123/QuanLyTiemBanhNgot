package com.nhom4.QuanLyTiemBanhNgot.dto.payment;

public record VnPayPaymentInitiationResponse(
        Long paymentId,
        String transactionReference,
        String paymentUrl
) {
}
