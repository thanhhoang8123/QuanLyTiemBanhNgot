package com.nhom4.QuanLyTiemBanhNgot.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record CreatePaymentRequest(
        @NotNull(message = "Mã đơn hàng không được để trống")
        @Positive(message = "Mã đơn hàng phải là số dương")
        Long orderId,

        @NotBlank(message = "Phương thức thanh toán không được để trống")
        @Pattern(
                regexp = "CASH|CARD|EWALLET|LOYALTY_POINTS",
                message = "Phương thức thanh toán phải là CASH, CARD, EWALLET hoặc LOYALTY_POINTS"
        )
        String paymentMethod
) {
}
