package com.nhom4.QuanLyTiemBanhNgot.dto.customorder;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UpdateCustomOrderRequest(
        @NotNull(message = "Mã khách hàng không được để trống")
        @Positive(message = "Mã khách hàng phải là số dương")
        Long customerId,

        @NotNull(message = "Mã nhân viên không được để trống")
        @Positive(message = "Mã nhân viên phải là số dương")
        Long employeeId,

        @NotBlank(message = "Tên bánh không được để trống")
        @Size(max = 150, message = "Tên bánh không được vượt quá 150 ký tự")
        String cakeName,

        @Size(max = 65535, message = "Mô tả yêu cầu vượt quá giới hạn cho phép")
        String requestDescription,

        @NotNull(message = "Ngày giao bánh không được để trống")
        LocalDateTime deliveryDate,

        @NotNull(message = "Giá dự kiến không được để trống")
        @Positive(message = "Giá dự kiến phải lớn hơn 0")
        @Digits(integer = 13, fraction = 2, message = "Giá dự kiến tối đa 13 chữ số nguyên và 2 chữ số thập phân")
        BigDecimal estimatedPrice,

        @NotNull(message = "Tiền cọc không được để trống")
        @DecimalMin(value = "0.00", message = "Tiền cọc không được âm")
        @Digits(integer = 13, fraction = 2, message = "Tiền cọc tối đa 13 chữ số nguyên và 2 chữ số thập phân")
        BigDecimal deposit
) {
}
