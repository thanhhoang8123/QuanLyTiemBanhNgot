package com.nhom4.QuanLyTiemBanhNgot.dto.payment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateVnPayPaymentRequest(
        @NotNull(message = "Mã đơn hàng không được để trống")
        @Positive(message = "Mã đơn hàng phải là số dương")
        Long orderId
) {
}
