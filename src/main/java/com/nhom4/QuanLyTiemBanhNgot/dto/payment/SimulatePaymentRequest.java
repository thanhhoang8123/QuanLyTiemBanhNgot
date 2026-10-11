package com.nhom4.QuanLyTiemBanhNgot.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SimulatePaymentRequest(
        @NotBlank(message = "Kết quả mô phỏng không được để trống")
        @Pattern(
                regexp = "SUCCESS|FAILED",
                message = "Kết quả mô phỏng phải là SUCCESS hoặc FAILED"
        )
        String result
) {
}
