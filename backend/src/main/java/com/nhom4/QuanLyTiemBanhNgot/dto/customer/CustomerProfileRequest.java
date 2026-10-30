package com.nhom4.QuanLyTiemBanhNgot.dto.customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CustomerProfileRequest(
        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
        String fullName,

        @Size(max = 15, message = "Số điện thoại không được vượt quá 15 ký tự")
        @Pattern(regexp = "^$|^[0-9+().\\- ]{7,15}$", message = "Số điện thoại không hợp lệ")
        String phone,

        @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
        String address
) {
}
