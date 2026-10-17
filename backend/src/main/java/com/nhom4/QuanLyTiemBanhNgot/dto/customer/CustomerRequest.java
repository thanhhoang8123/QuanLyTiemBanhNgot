package com.nhom4.QuanLyTiemBanhNgot.dto.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
        @NotBlank(message = "Họ và tên khách hàng không được để trống")
        @Size(max = 100, message = "Họ và tên không được vượt quá 100 ký tự")
        String fullName,

        @Size(max = 15, message = "Số điện thoại không được vượt quá 15 ký tự")
        String phone,

        @Email(message = "Email không đúng định dạng")
        @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
        String email,

        @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
        String address
) {
}
