package com.nhom4.QuanLyTiemBanhNgot.dto.customorder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateCustomOrderStatusRequest(
        @NotBlank(message = "Trạng thái không được để trống")
        @Pattern(
                regexp = "PENDING|CONFIRMED|IN_PROGRESS|COMPLETED|CANCELLED",
                message = "Trạng thái phải là PENDING, CONFIRMED, IN_PROGRESS, COMPLETED hoặc CANCELLED"
        )
        String status
) {
}
